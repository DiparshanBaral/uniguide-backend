const express = require('express');
const { loginAdmin, getCounts } = require('../controllers/adminController');

const router = express.Router();

// Admin Login
router.post('/login', loginAdmin);

// Get counts for universities, mentors, students, and discussion rooms
router.get('/counts', getCounts);

module.exports = router;
