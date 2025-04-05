const express = require('express');
const {
  getAllVisaExperiences,
  postVisaExperience,
  updateVisaExperience,
  deleteVisaExperience,
  getAuthorPosts,
  getRecentExperiences,
  toggleLike,
} = require('../controllers/visaController');
const { protect } = require('../middleware/authMiddleware');


const router = express.Router();

// Route to get all visa experiences
router.get('/experiences', getAllVisaExperiences);

// Route to post a new visa experience
router.post('/experience', protect, postVisaExperience);

// Route to get recent visa experiences
router.get('/experiences/recent', getRecentExperiences);

// Route to update a visa experience
router.put('/update/experience', protect, updateVisaExperience);

// Route to delete a visa experience
router.delete('/experience', protect,deleteVisaExperience);

// Route to get an author's posts
router.get('/experience/author/:authorId', protect, getAuthorPosts);

// Route to get an author's posts
router.get('/experience/author/:authorId', protect, getAuthorPosts);

// Route to like a post
router.post('/experience/like', protect, toggleLike);

module.exports = router;