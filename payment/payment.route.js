// routes/payment.routes.js
const express = require("express");
const paymentController = require("./payment.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create Payment Intent
router.post("/create-payment-intent", paymentController.createPaymentIntent);

// Change Payment Status Automatically
router.post("/change-payment-status", paymentController.changePaymentStatus);

// Get Payment Status for a Connection
router.get("/connection-status/:connectionId", protect, paymentController.getConnectionPaymentStatus);

// Get Specific Transaction Details (Protected Route)
router.get("/transaction/:payment_uuid", protect, paymentController.getTransactionDetails);

// Add this new route
router.get('/transactions/:userId', paymentController.getTransactionsByUser);

module.exports = router;