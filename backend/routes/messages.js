const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { dbGet, dbRun, dbAll } = require('../database');

// All routes require authentication
router.use(authenticateToken);

// Send message to channel
router.post('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify channel exists
    const channel = await dbGet('SELECT id FROM channels WHERE id = ?', [channelId]);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Insert message
    const result = await dbRun(
      'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)',
      [channelId, req.user.id, content.trim()]
    );

    // Get message with user info
    const message = await dbGet(
      `SELECT m.*, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.lastID]
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get direct messages between current user and another user
router.get('/dm/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Get messages where current user is sender or receiver
    const messages = await dbAll(
      `SELECT dm.*, 
              sender.username as sender_username, sender.profile_picture as sender_picture,
              receiver.username as receiver_username, receiver.profile_picture as receiver_picture
       FROM direct_messages dm
       JOIN users sender ON dm.sender_id = sender.id
       JOIN users receiver ON dm.receiver_id = receiver.id
       WHERE (dm.sender_id = ? AND dm.receiver_id = ?) 
          OR (dm.sender_id = ? AND dm.receiver_id = ?)
       ORDER BY dm.created_at ASC
       LIMIT 100`,
      [currentUserId, userId, userId, currentUserId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get DM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send direct message
router.post('/dm/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify receiver exists
    const receiver = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Insert direct message
    const result = await dbRun(
      'INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [currentUserId, userId, content.trim()]
    );

    // Get message with user info
    const message = await dbGet(
      `SELECT dm.*,
              sender.username as sender_username, sender.profile_picture as sender_picture,
              receiver.username as receiver_username, receiver.profile_picture as receiver_picture
       FROM direct_messages dm
       JOIN users sender ON dm.sender_id = sender.id
       JOIN users receiver ON dm.receiver_id = receiver.id
       WHERE dm.id = ?`,
      [result.lastID]
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
