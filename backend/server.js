const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS enabled
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch((err) => {
    console.error('Database initialization error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.IO connection handling
// Store user socket connections: { userId: socketId }
const userSockets = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  // Verify JWT token (simplified - in production, use same JWT verification as HTTP)
  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  // Store socket connection
  userSockets.set(socket.userId, socket.id);

  // Join user to their personal room (for DMs)
  socket.join(`user_${socket.userId}`);

  // Handle joining a channel room
  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
    console.log(`User ${socket.username} joined channel ${channelId}`);
  });

  // Handle leaving a channel room
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
    console.log(`User ${socket.username} left channel ${channelId}`);
  });

  // Handle new message in channel
  socket.on('channel_message', async (data) => {
    // Broadcast to all users in the channel
    io.to(`channel_${data.channelId}`).emit('new_channel_message', {
      ...data.message,
      channelId: data.channelId
    });
  });

  // Handle direct message
  socket.on('direct_message', async (data) => {
    // Send to both sender and receiver
    io.to(`user_${data.receiverId}`).emit('new_direct_message', data.message);
    socket.emit('new_direct_message', data.message); // Also send back to sender
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username} (${socket.userId})`);
    userSockets.delete(socket.userId);
  });
});

// Start server
server.listen(PORT, '0.0.0.0',  () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
