import axios from 'axios';

// API base URL - change this if your backend is running on a different port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized) - clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  
  getMe: () =>
    api.get('/auth/me')
};

// Channels API
export const channelsAPI = {
  getAll: () =>
    api.get('/channels'),
  
  getById: (id) =>
    api.get(`/channels/${id}`),
  
  create: (name, description) =>
    api.post('/channels', { name, description }),
  
  getMessages: (channelId) =>
    api.get(`/channels/${channelId}/messages`)
};

// Messages API
export const messagesAPI = {
  sendChannelMessage: (channelId, content) =>
    api.post(`/messages/channel/${channelId}`, { content }),
  
  getDirectMessages: (userId) =>
    api.get(`/messages/dm/${userId}`),
  
  sendDirectMessage: (userId, content) =>
    api.post(`/messages/dm/${userId}`, { content })
};

// Users API
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  getById: (id) =>
    api.get(`/users/${id}`),
  
  getFriends: () =>
    api.get('/users/friends/list'),
  
  sendFriendRequest: (userId) =>
    api.post(`/users/friends/request/${userId}`),
  
  acceptFriendRequest: (userId) =>
    api.post(`/users/friends/accept/${userId}`)
};

// Upload API
export const uploadAPI = {
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;
