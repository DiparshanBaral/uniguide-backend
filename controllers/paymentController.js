const { Payment } = require('../models/paymentModel');
const Affiliation = require('../models/affiliationModel');
const { Mentor } = require('../models/mentorModel');
const { Notification } = require('../models/notificationModel');

// Create a payment record when mentor applies for affiliation
const createPayment = async (req, res) => {
  try {
    const { affiliationId, mentorId, expectedConsultationFee, currency } = req.body;

    if (!affiliationId || !mentorId || !expectedConsultationFee || !currency) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }

    // Check if affiliation exists
    const affiliation = await Affiliation.findById(affiliationId);
    if (!affiliation) {
      return res.status(404).json({ error: 'Affiliation not found' });
    }

    // Check if mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Create payment record with negotiation history
    const payment = new Payment({
      affiliationId,
      mentorId,
      expectedConsultationFee,
      currency,
      negotiationHistory: [
        {
          proposedBy: 'mentor',
          amount: expectedConsultationFee,
          message: 'Initial fee proposal',
        },
      ],
    });

    await payment.save();

    // Update affiliation with payment ID
    affiliation.paymentId = payment._id;
    await affiliation.save();

    res.status(201).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error creating payment record:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin negotiates fee
const negotiateFee = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { negotiatedConsultationFee, message } = req.body;

    if (!negotiatedConsultationFee) {
      return res.status(400).json({ error: 'Negotiated fee is required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Update payment record
    payment.negotiatedConsultationFee = negotiatedConsultationFee;
    payment.status = 'admin_approved';
    
    // Add to negotiation history
    payment.negotiationHistory.push({
      proposedBy: 'admin',
      amount: negotiatedConsultationFee,
      message: message || 'Admin fee negotiation',
    });

    await payment.save();

    // Update affiliation status
    const affiliation = await Affiliation.findById(payment.affiliationId);
    if (affiliation) {
      affiliation.status = 'Pending_Mentor_Approval';
      await affiliation.save();
    }

    // Create notification for mentor
    const notification = new Notification({
      userId: payment.mentorId,
      userRole: 'Mentor',
      title: 'Affiliation Fee Negotiated',
      description: `Admin has negotiated your consultation fee to ${negotiatedConsultationFee} ${payment.currency}. Please review and approve.`,
      link: '/payment/review',
    });

    await notification.save();

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error negotiating fee:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Mentor accepts or rejects negotiated fee
const respondToNegotiation = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { response, counterOffer, message } = req.body;

    if (!response || !['accept', 'counter', 'reject'].includes(response)) {
      return res.status(400).json({ error: 'Valid response is required (accept, counter, or reject)' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Handle different response types
    if (response === 'accept') {
      payment.finalConsultationFee = payment.negotiatedConsultationFee;
      payment.status = 'mentor_approved';

      // Update affiliation
      const affiliation = await Affiliation.findById(payment.affiliationId);
      if (affiliation) {
        affiliation.status = 'Approved';
        await affiliation.save();
      }

      // Update mentor status
      const mentor = await Mentor.findById(payment.mentorId);
      if (mentor) {
        mentor.isApproved = true;
        await mentor.save();
      }

      // Create notification for admin
      const notification = new Notification({
        userId: process.env.ADMIN_ID, // Should be set to actual admin ID
        userRole: 'Admin',
        title: 'Affiliation Fee Accepted',
        description: `Mentor has accepted the negotiated fee of ${payment.negotiatedConsultationFee} ${payment.currency}.`,
        link: '/admin/affiliations',
      });

      await notification.save();
    } else if (response === 'counter') {
      if (!counterOffer) {
        return res.status(400).json({ error: 'Counter offer amount is required' });
      }

      payment.expectedConsultationFee = counterOffer;
      payment.status = 'pending';
      
      // Add to negotiation history
      payment.negotiationHistory.push({
        proposedBy: 'mentor',
        amount: counterOffer,
        message: message || 'Mentor counter offer',
      });

      // Create notification for admin
      const notification = new Notification({
        userId: process.env.ADMIN_ID, // Should be set to actual admin ID
        userRole: 'Admin',
        title: 'Fee Counter Offer',
        description: `Mentor has countered with a fee of ${counterOffer} ${payment.currency}.`,
        link: '/admin/affiliations',
      });

      await notification.save();
    } else if (response === 'reject') {
      payment.status = 'rejected';

      // Update affiliation
      const affiliation = await Affiliation.findById(payment.affiliationId);
      if (affiliation) {
        affiliation.status = 'Rejected';
        await affiliation.save();
      }

      // Create notification for admin
      const notification = new Notification({
        userId: process.env.ADMIN_ID, // Should be set to actual admin ID
        userRole: 'Admin',
        title: 'Affiliation Fee Rejected',
        description: `Mentor has rejected the negotiated fee of ${payment.negotiatedConsultationFee} ${payment.currency}.`,
        link: '/admin/affiliations',
      });

      await notification.save();
    }

    await payment.save();

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error processing mentor response:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  negotiateFee,
  respondToNegotiation,
};