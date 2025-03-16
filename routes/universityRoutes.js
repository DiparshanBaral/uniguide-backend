const express = require('express');
const { addUniversity, 
    getUniversityById, 
    getUniversitiesByCountry, 
    deleteUniversityById, 
    updateUniversityById,
    searchUniversities,
    findUniversities,   
} = require('../controllers/universityController');
const router = express.Router();
const { uploadUniversityImage } = require('../config/cloudinaryConfig');

// Route to add a new university
router.post('/add', addUniversity);

// Route to get a university by ID (supports US, UK, Canada, Australia)
router.get('/:country/:id', getUniversityById);

// Route to fetch all universities by country
router.get('/:country', getUniversitiesByCountry);

// Route to delete a university by ID 
router.delete('/:id', deleteUniversityById);

// Route to update a university by ID (supports image upload)
router.put('/:country/:id', uploadUniversityImage.single('image'), updateUniversityById);

// New Route: Real-time search suggestions
router.get('/search', searchUniversities);

// New Route: Full search for "Find Universities" button
router.get('/find', findUniversities);

module.exports = router;
