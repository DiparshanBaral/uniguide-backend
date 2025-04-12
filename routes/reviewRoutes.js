const express = require('express');
const {
  addReview,
  getReviewsForMentor,
  getAverageRating,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to add a review for a mentor
router.post('/', protect, addReview);

// Route to get all reviews for a mentor
router.get('/:mentorId', protect, getReviewsForMentor);

// Route to get the average rating for a mentor
router.get('/:mentorId/average', protect, getAverageRating);

module.exports = router;