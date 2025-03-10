const express = require('express');
const {
  registerStudent,
  loginStudent,
  getStudentById,
  updateStudent,
  getPublicStudentProfile,
  addToWishlist,
} = require('../controllers/studentController');
const { protect, protectStudentRoute, deleteStudentById } = require('../middleware/authMiddleware');
const { uploadProfilePic } = require('../config/cloudinaryConfig');

const router = express.Router();

// Student Registration
router.post('/signup', registerStudent);

// Student Login
router.post('/login', loginStudent);

// Get Student by ID (protected route)
router.get('/:id', protect, getStudentById);

// Update Student by ID (protected route) with profile picture upload
router.put('/:id', protect, uploadProfilePic.single('profilePic'), updateStudent);

// Delete Student by ID
// router.delete('/:id', deleteStudentById);

// Public Routes
router.get('/public/:id', protect, getPublicStudentProfile);

router.post('/wishlist', protect, addToWishlist);


module.exports = router;
