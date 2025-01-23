const express = require('express');
const {
  registerUser,
  loginUser,
  getUserById,
  updateUser, // Import the new function
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// User Registration
router.post('/signup', registerUser);

// User Login
router.post('/login', loginUser);

// Get User by ID (protected route example)
router.get('/:id', protect, getUserById);

// Update User by ID (protected route)
router.put('/:id', protect, updateUser); // Add this new route

module.exports = router;