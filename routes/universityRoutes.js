const express = require('express');
const { addUniversity, getUniversityById } = require('../controllers/universityController');
const router = express.Router();

// Route to add a new university
router.post('/add', addUniversity);

// Route to get a university by ID (supports US, UK, Canada, Australia)
router.get('/:country/:id', getUniversityById);

module.exports = router;
