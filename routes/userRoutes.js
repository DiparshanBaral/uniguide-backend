const express = require('express');
const { registerUser, loginUser, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// User Registration
router.post('/signup', registerUser);

// User Login
router.post('/login', loginUser);

// Get User by ID (protected route example)
router.get('/:id', getUserById);

module.exports = router;
