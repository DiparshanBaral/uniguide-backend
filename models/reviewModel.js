const mongoose = require('mongoose');
const { Mentor } = require('./mentorModel');
const { Student } = require('./studentModel');


const reviewSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Mentor,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Student,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // Ratings are on a scale of 1 to 5
    },
    review: {
      type: String,
      maxlength: 500, // Limit the review content to 500 characters
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set the creation date
    },
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Review = db.model('Review', reviewSchema, 'Reviews');

module.exports = { Review };