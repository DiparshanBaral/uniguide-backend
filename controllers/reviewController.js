const { Review } = require('../models/reviewModel');
const { Mentor } = require('../models/mentorModel');
const { Connection } = require('../models/connectionModel');

// Add a review for a mentor
const addReview = async (req, res) => {
  const { mentorId, rating, review } = req.body;
  const studentId = req.user.id; // Assuming the student is authenticated

  try {
    // Check if the mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check if the student is connected to the mentor
    const isConnected = await Connection.findOne({
        mentorId,
        studentId,
        status: 'Approved',
      });

    if (!isConnected) {
      return res.status(403).json({
        message: 'You can only review mentors you are connected to.',
      });
    }

    // Check if the student has already reviewed this mentor
    const existingReview = await Review.findOne({ mentorId, studentId });
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this mentor' });
    }

    // Create a new review
    const newReview = await Review.create({
      mentorId,
      studentId,
      rating,
      review,
    });

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview,
    });
  } catch (error) {
    console.error('Error adding review:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reviews for a mentor
const getReviewsForMentor = async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Fetch all reviews for the given mentor
    const reviews = await Review.find({ mentorId }).populate('studentId', 'firstname lastname');

    res.status(200).json({
      message: 'Reviews fetched successfully',
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get average rating for a mentor
const getAverageRating = async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Calculate the average rating for the mentor
    const reviews = await Review.find({ mentorId });
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

    res.status(200).json({
      message: 'Average rating fetched successfully',
      averageRating: averageRating.toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching average rating:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addReview,
  getReviewsForMentor,
  getAverageRating,
};