const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
// Add protected routes here
// Example: router.get('/profile', protect, getUserProfile);

module.exports = router;
