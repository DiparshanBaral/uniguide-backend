const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('./payment.model');
const { Connection } = require('../models/connectionModel');
const { Mentor } = require('../models/mentorModel');
const { PaymentNegotiation } = require('../models/paymentNegotiationModel');
const { v4: uuidv4 } = require('uuid');
const Wallet = require('../models/walletModel');

// Constants
const MENTOR_SPLIT_PERCENTAGE = 80;
const ADMIN_SPLIT_PERCENTAGE = 20;

// Normalize currency code mapping
const normalizeCurrencyCode = (code) => {
  const currencyMap = {
    'nrs': 'npr', // Map Nepalese Rupee from 'nrs' to 'npr'
    'rs': 'inr',  // Map Indian Rupee from 'rs' to 'inr'
    'rupee': 'inr',
    'rupees': 'inr',
  };
  const lowercaseCode = (code || '').toLowerCase();
  return currencyMap[lowercaseCode] || lowercaseCode;
};

// Calculate payment splits
const calculatePaymentSplits = (totalAmount) => {
  const mentorPayment = (totalAmount * MENTOR_SPLIT_PERCENTAGE) / 100;
  const adminPayment = (totalAmount * ADMIN_SPLIT_PERCENTAGE) / 100;
  
  return {
    mentorPayment: parseFloat(mentorPayment.toFixed(2)),
    adminPayment: parseFloat(adminPayment.toFixed(2))
  };
};

// Create a Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { connectionId, fee, currency } = req.body;
    console.log('Creating payment intent for connection:', connectionId);

    // Fetch the connection details
    const connection = await Connection.findById(connectionId)
      .populate('studentId')
      .populate('mentorId');

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Validate mentorId and studentId
    if (!connection.mentorId || !connection.studentId) {
      return res.status(400).json({ error: 'Invalid connection details' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      connectionId,
      paymentStatus: 'paid',
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already completed for this connection' });
    }

    // Get the fee details
    let amount, currencyCode;

    if (fee && currency) {
      // If fee details are provided in the request, use them
      amount = fee;
      currencyCode = normalizeCurrencyCode(currency);
    } else {
      // Use the populated mentor data as fallback
      const mentor = connection.mentorId;

      // Try to find negotiated fee
      const negotiation = await PaymentNegotiation.findOne({
        mentorId: mentor._id,
        status: 'mentor_approved',
      });

      if (negotiation && negotiation.finalConsultationFee) {
        amount = negotiation.finalConsultationFee;
        currencyCode = normalizeCurrencyCode(negotiation.currency);
      } else {
        amount = mentor.consultationFee;
        currencyCode = normalizeCurrencyCode(mentor.currency);
      }
    }

    console.log(`Processing payment: Amount: ${amount}, Currency: ${currencyCode}`);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid consultation fee' });
    }

    if (!currencyCode) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Calculate payment splits (80% mentor, 20% admin)
    const { mentorPayment, adminPayment } = calculatePaymentSplits(amount);
    
    console.log(`Payment split: Mentor: ${mentorPayment} (${MENTOR_SPLIT_PERCENTAGE}%), Admin: ${adminPayment} (${ADMIN_SPLIT_PERCENTAGE}%)`);

    // Create a Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currencyCode,
      payment_method_types: ['card'],
    });

    // Save Payment Details to Database
    const newPayment = new Payment({
      payment_uuid: uuidv4(),
      studentId: connection.studentId._id,
      mentorId: connection.mentorId._id,
      connectionId: connection._id,
      amount,
      mentorPayment,
      adminPayment,
      currency: currencyCode,
      paymentIntentId: paymentIntent.id,
      paymentMethod: 'card',
      paymentStatus: 'pending',
    });

    await newPayment.save();

    // Send Client Secret to Frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      payment_uuid: newPayment.payment_uuid,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Change Payment Status Automatically
const changePaymentStatus = async (req, res) => {
  try {
    const { payment_uuid } = req.body;

    // Find Payment by UUID
    const payment = await Payment.findOne({ payment_uuid });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Retrieve Payment Intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status
      payment.paymentStatus = 'paid';
      
      // Find or create mentor wallet
      let mentorWallet = await Wallet.findOne({ 
        userId: payment.mentorId, 
        userType: 'Mentor'
      });
      
      if (!mentorWallet) {
        mentorWallet = new Wallet({
          userId: payment.mentorId,
          userType: 'Mentor',
          balance: 0,
          currency: payment.currency
        });
      }
      
      // Add the mentor's payment to their wallet
      mentorWallet.balance += payment.mentorPayment;
      
      // Add transaction record
      mentorWallet.transactions.push({
        amount: payment.mentorPayment,
        type: 'deposit',
        paymentId: payment._id,
      });
      
      // Save mentor wallet
      await mentorWallet.save();
      
      // Find or create admin wallet
      const adminId = "67b1a5f12167e10a7e2c2f89";
      
      let adminWallet = await Wallet.findOne({
        userId: adminId,
        userType: 'Admin'
      });
      
      if (!adminWallet) {
        adminWallet = new Wallet({
          userId: adminId,
          userType: 'Admin',
          balance: 0,
          currency: payment.currency
        });
      }
      
      // Add the admin's payment to their wallet
      adminWallet.balance += payment.adminPayment;
      
      // Add transaction record
      adminWallet.transactions.push({
        amount: payment.adminPayment,
        type: 'deposit',
        paymentId: payment._id,
      });
      
      // Save admin wallet
      await adminWallet.save();
      
      // Mark that the mentor has been paid
      payment.mentorPaid = true;
      
      // Save the payment
      await payment.save();

      return res.status(200).json({ 
        message: 'Payment status updated successfully',
        mentorPayment: payment.mentorPayment,
        adminPayment: payment.adminPayment
      });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to change payment status' });
  }
};

// Get All Transactions for a Specific User
const getAllTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all transactions where the user is either the student or the mentor
    const transactions = await Payment.find({
      $or: [{ studentId: userId }, { mentorId: userId }],
    })
      .populate('connectionId')
      .sort({ createdAt: -1 });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get Specific Transaction Details
const getTransactionDetails = async (req, res) => {
  try {
    const { payment_uuid } = req.params;

    // Find the transaction by payment_uuid and populate the connection details
    const transaction = await Payment.findOne({ payment_uuid }).populate('connectionId');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
};

// Get Payment Status for a Connection
const getConnectionPaymentStatus = async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Find the most recent payment for this connection
    const payment = await Payment.findOne({ connectionId }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(200).json({ status: 'pending', payment: null });
    }

    res.status(200).json({ status: payment.paymentStatus, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

// Get Transactions By User
const getTransactionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all payments where the user is either the student or the mentor
    const transactions = await Payment.find({
      $or: [
        { studentId: userId },
        { mentorId: userId },
      ],
    })
      .populate({
        path: 'studentId',
        select: 'firstname lastname email',
        options: { lean: true },
      })
      .populate({
        path: 'mentorId',
        select: 'firstname lastname email',
        options: { lean: true },
      })
      .sort({ createdAt: -1 });

    // Replace missing references with default values
    transactions.forEach((payment) => {
      if (!payment.mentorId) {
        payment.mentorId = { firstname: 'Unknown', lastname: '' };
      }
      if (!payment.studentId) {
        payment.studentId = { firstname: 'Unknown', lastname: '' };
      }
    });

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Export All Functions
module.exports = {
  createPaymentIntent,
  changePaymentStatus,
  getAllTransactions,
  getTransactionDetails,
  getConnectionPaymentStatus,
  getTransactionsByUser,
};