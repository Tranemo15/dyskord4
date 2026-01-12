import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar';
import MessageArea from './MessageArea';
import { channelsAPI, usersAPI } from '../api';
import { authAPI } from '../api';

function Chat({ user, onLogout, onUserUpdate }) {
  const [channels, setChannels] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch channels and friends on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, friendsRes, usersRes] = await Promise.all([
          channelsAPI.getAll(),
          usersAPI.getFriends(),
          usersAPI.getAll()
        ]);

        setChannels(channelsRes.data);
        setFriends(friendsRes.data);
        setAllUsers(usersRes.data);

        // Select first channel if available
        if (channelsRes.data.length > 0) {
          setSelectedChannel(channelsRes.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle channel selection
  const handleChannelSelect = (channelId) => {
    setSelectedChannel(channelId);
    setSelectedDM(null);
  };

  // Handle DM selection
  const handleDMSelect = (userId) => {
    setSelectedDM(userId);
    setSelectedChannel(null);
  };

  // Handle new channel creation
  const handleChannelCreate = async (name, description) => {
    try {
      const response = await channelsAPI.create(name, description);
      setChannels([...channels, response.data]);
      setSelectedChannel(response.data.id);
      setSelectedDM(null);
    } catch (error) {
      console.error('Error creating channel:', error);
      alert(error.response?.data?.error || 'Failed to create channel');
    }
  };

  // Refresh user data after profile picture update
  const handleUserUpdate = async () => {
    try {
      const response = await authAPI.getMe();
      onUserUpdate(response.data);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#dcddde'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Sidebar
        channels={channels}
        friends={friends}
        allUsers={allUsers}
        selectedChannel={selectedChannel}
        selectedDM={selectedDM}
        onChannelSelect={handleChannelSelect}
        onDMSelect={handleDMSelect}
        onChannelCreate={handleChannelCreate}
        onLogout={onLogout}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
      <MessageArea
        channelId={selectedChannel}
        dmUserId={selectedDM}
        socket={socket}
        currentUser={user}
      />
    </div>
  );
}

export default Chat;
