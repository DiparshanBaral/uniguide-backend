const express = require('express');
const router = express.Router();
const {
  createPayment,
  negotiateFee,
  respondToNegotiation,
} = require('../controllers/paymentController');
const { protect, protectAdminRoute } = require('../middleware/authMiddleware');

// Create a new payment record
router.post('/create', protect, createPayment);

// Admin negotiates fee
router.put('/:paymentId/negotiate', protect, protectAdminRoute, negotiateFee);

// Mentor responds to negotiation (accept/counter/reject)
router.put('/:paymentId/respond', protect, respondToNegotiation);

module.exports = router;