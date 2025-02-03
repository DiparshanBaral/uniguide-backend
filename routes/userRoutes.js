const express = require('express');
const {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// User Registration
router.post('/signup', registerUser);

// User Login
router.post('/login', loginUser);

router.get('/mentor/:id', getUserById)

// Get User by ID (protected route)
router.get('/:id', protect, getUserById);


// Update User by ID (protected route)
router.put('/:id', protect, updateUser);

module.exports = router;