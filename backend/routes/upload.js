const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { dbRun, dbGet } = require('../database');

// All routes require authentication
router.use(authenticateToken);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
// Accept GIF, JPG, PNG files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userid-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only accept image files (including GIF)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only GIF, JPG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get relative path from backend directory
    const relativePath = path.join('uploads', 'profile-pictures', req.file.filename);
    const filePath = `/api/${relativePath.replace(/\\/g, '/')}`; // Convert to URL path

    // Delete old profile picture if exists
    const user = await dbGet('SELECT profile_picture FROM users WHERE id = ?', [req.user.id]);
    if (user && user.profile_picture) {
      const oldPath = path.join(__dirname, '..', user.profile_picture.replace('/api/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user's profile picture in database
    await dbRun(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [filePath, req.user.id]
    );

    res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture: filePath
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

module.exports = router;
