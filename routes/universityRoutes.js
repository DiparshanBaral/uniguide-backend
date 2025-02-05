const express = require('express');
const { addUniversity, getUniversityById, getUniversitiesByCountry } = require('../controllers/universityController');
const router = express.Router();

// Route to add a new university
router.post('/add', addUniversity);

// Route to get a university by ID (supports US, UK, Canada, Australia)
router.get('/:country/:id', getUniversityById);

// Route to fetch all universities by country
router.get('/:country', getUniversitiesByCountry);

module.exports = router;
