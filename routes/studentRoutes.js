const express = require('express');
const {
  registerStudent,
  loginStudent,
  getStudentById,
  updateStudent,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Student Registration
router.post('/signup', registerStudent);

// Student Login
router.post('/login', loginStudent);

// Get Student by ID (protected route)
router.get('/:id', protect, getStudentById);

// Update Student by ID (protected route)
router.put('/:id', protect, updateStudent);

module.exports = router;
