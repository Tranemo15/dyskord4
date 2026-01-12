const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { dbGet, dbAll, dbRun } = require('../database');

// All routes require authentication
router.use(authenticateToken);

// Get all users (for friend search, etc.)
router.get('/', async (req, res) => {
  try {
    const users = await dbAll(
      'SELECT id, username, email, profile_picture, created_at FROM users ORDER BY username ASC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, profile_picture, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friendships for current user
router.get('/friends/list', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all friendships where user is involved
    const friendships = await dbAll(
      `SELECT f.*,
              u1.id as user1_id, u1.username as user1_username, u1.profile_picture as user1_picture,
              u2.id as user2_id, u2.username as user2_username, u2.profile_picture as user2_picture
       FROM friendships f
       JOIN users u1 ON f.user1_id = u1.id
       JOIN users u2 ON f.user2_id = u2.id
       WHERE (f.user1_id = ? OR f.user2_id = ?) AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [userId, userId]
    );

    // Map to friend objects (excluding current user)
    const friends = friendships.map(f => {
      if (f.user1_id === userId) {
        return {
          id: f.user2_id,
          username: f.user2_username,
          profile_picture: f.user2_picture
        };
      } else {
        return {
          id: f.user1_id,
          username: f.user1_username,
          profile_picture: f.user1_picture
        };
      }
    });

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request
router.post('/friends/request/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Verify user exists
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existing = await dbGet(
      'SELECT * FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [currentUserId, userId, userId, currentUserId]
    );

    if (existing) {
      return res.status(409).json({ error: 'Friendship already exists' });
    }

    // Create friendship request (always set user1_id < user2_id for consistency)
    const user1Id = Math.min(currentUserId, userId);
    const user2Id = Math.max(currentUserId, userId);

    await dbRun(
      'INSERT INTO friendships (user1_id, user2_id, status) VALUES (?, ?, ?)',
      [user1Id, user2Id, 'pending']
    );

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.post('/friends/accept/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user1Id = Math.min(currentUserId, userId);
    const user2Id = Math.max(currentUserId, userId);

    const result = await dbRun(
      'UPDATE friendships SET status = ? WHERE user1_id = ? AND user2_id = ?',
      ['accepted', user1Id, user2Id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Friendship request not found' });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
