const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { dbGet, dbAll, dbRun } = require('../database');

// All routes require authentication
router.use(authenticateToken);

// Get all channels
router.get('/', async (req, res) => {
  try {
    const channels = await dbAll(`
      SELECT c.*, u.username as created_by_username
      FROM channels c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at ASC
    `);
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single channel by ID
router.get('/:id', async (req, res) => {
  try {
    const channel = await dbGet(
      `SELECT c.*, u.username as created_by_username
       FROM channels c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new channel
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const result = await dbRun(
      'INSERT INTO channels (name, description, created_by) VALUES (?, ?, ?)',
      [name, description || null, req.user.id]
    );

    const channel = await dbGet(
      `SELECT c.*, u.username as created_by_username
       FROM channels c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
      [result.lastID]
    );

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages in a channel
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await dbAll(
      `SELECT m.*, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.channel_id = ?
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.params.id]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
