const express = require('express');
const {
  registerMentor,
  loginMentor,
  getMentorById,
  updateMentor,
} = require('../controllers/mentorController');
const { protect, protectMentorRoute, deleteMentorById } = require('../middleware/authMiddleware');
const { uploadProfilePic } = require('../config/cloudinaryConfig');

const router = express.Router();

// Mentor Registration
router.post('/signup', registerMentor);

// Mentor Login
router.post('/login', loginMentor);

// Get Mentor by ID (protected route)
router.get('/:id', getMentorById);

// Update Mentor by ID (protected route) with profile picture upload
router.put('/:id', protect, uploadProfilePic.single('profilePic'), updateMentor);

// Delete Mentor by ID
// router.delete('/:id', deleteMentorById);

module.exports = router;
