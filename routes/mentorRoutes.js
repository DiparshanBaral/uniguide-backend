const express = require('express');
const {
  registerMentor,
  loginMentor,
  getMentorProfile,
  getMentorPublicProfile,
  updateMentor,
  deleteMentorById,
  getAllMentors,
} = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePic } = require('../config/cloudinaryConfig');

const router = express.Router();

// Mentor Registration
router.post('/signup', registerMentor);

// Mentor Login
router.post('/login', loginMentor);

// Get Mentor by ID (Protected: Only the mentor themselves can access their profile)
router.get('/profile/:id', protect, getMentorProfile);

// Get Mentor by ID (Public: Students and other mentors can access this)
router.get('/:id', getMentorPublicProfile);

// Update Mentor by ID (protected route) with profile picture upload
router.put('/:id', protect, uploadProfilePic.single('profilePic'), updateMentor);

// Delete Mentor by ID
router.delete('/:id', deleteMentorById);

// Route to get all mentors
router.get('/', protect, getAllMentors);

module.exports = router;
