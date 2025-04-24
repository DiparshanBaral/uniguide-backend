const mongoose = require('mongoose');
const { Mentor } = require('./mentorModel');

const paymentSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Mentor,
      required: true,
    },
    affiliationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Affiliation',
      required: true,
    },
    expectedConsultationFee: {
      type: Number,
      required: true,
    },
    negotiatedConsultationFee: {
      type: Number,
      default: null,
    },
    finalConsultationFee: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      required: true,
      enum: ['NRS', 'USD', 'GBP', 'AUD', 'CAD'],
      default: 'USD',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'admin_approved', 'mentor_approved', 'rejected', 'completed'],
      default: 'pending',
    },
    stripePaymentId: {
      type: String,
      default: null,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    negotiationHistory: [
      {
        proposedBy: {
          type: String,
          enum: ['admin', 'mentor'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const usersDb = mongoose.connection.useDb('Users');
const Payment = usersDb.model('Payment', paymentSchema, 'Payments');

module.exports = { Payment };