const express = require('express');
const {
  registerStudent,
  loginStudent,
  getStudentById,
  updateStudent,
  getPublicStudentProfile,
  addToWishlist,
  deleteStudentById,
  getAllStudents,
  getWishlistUniversities,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePic } = require('../config/cloudinaryConfig');

const router = express.Router();

// Student Registration
router.post('/signup', registerStudent);

// Student Login
router.post('/login', loginStudent);

// Route to get all wishlist universities by name
router.get('/wishlist', protect, getWishlistUniversities);

// Get Student by ID (protected route)
router.get('/:id', protect, getStudentById);

// Update Student by ID (protected route) with profile picture upload
router.put('/:id', protect, uploadProfilePic.single('profilePic'), updateStudent);

// Route to get all students
router.get('/', protect, getAllStudents);

// Delete Student by ID
router.delete('/:id', deleteStudentById);

// Public Routes
router.get('/public/:id', protect, getPublicStudentProfile);

// Add university to wishlist
router.post('/wishlist', protect, addToWishlist);



module.exports = router;
