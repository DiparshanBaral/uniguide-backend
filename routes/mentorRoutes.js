const express = require('express');
const {
  registerMentor,
  loginMentor,
  getMentorById,
  updateMentor,
} = require('../controllers/mentorController');
const { protect, protectMentorRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Mentor Registration
router.post('/signup', registerMentor);

// Mentor Login
router.post('/login', loginMentor);

// Get Mentor by ID (protected route)
router.get('/:id', getMentorById);

// Update Mentor by ID (protected route)
router.put('/:id', updateMentor);

module.exports = router;
