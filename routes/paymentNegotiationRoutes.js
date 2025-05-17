const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const paymentNegotiationController = require('../controllers/paymentNegotiationController');

// Create a new payment record
router.post('/create', protect, paymentNegotiationController.createPayment);

// Get negotiation by ID
router.get('/:id', protect, paymentNegotiationController.getNegotiationById);

// Get negotiations for mentor
router.get('/mentor/:mentorId', protect, paymentNegotiationController.getMentorNegotiations);

// Admin negotiates fee
router.put('/:id/negotiate', protect, paymentNegotiationController.negotiateFee);

// Mentor responds to negotiation
router.put('/:id/respond', protect, paymentNegotiationController.respondToNegotiation);

// Add this route
router.get('/connection/:connectionId', protect, paymentNegotiationController.getNegotiationsByConnectionId);

module.exports = router;