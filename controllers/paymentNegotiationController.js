const { PaymentNegotiation } = require('../models/paymentNegotiationModel');
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

// Get negotiation by ID
const getNegotiationById = async (req, res) => {
  try {
    const { id } = req.params;
    const negotiation = await PaymentNegotiation.findById(id);
    
    if (!negotiation) {
      return res.status(404).json({ error: 'Payment negotiation not found' });
    }
    
    res.status(200).json({ success: true, negotiation });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get negotiations for mentor
const getMentorNegotiations = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const negotiations = await PaymentNegotiation.find({ mentorId });
    res.status(200).json({ success: true, negotiations });
  } catch (error) {
    console.error('Error fetching mentor negotiations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin negotiates fee
const negotiateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { negotiatedConsultationFee, message } = req.body;
    
    if (!negotiatedConsultationFee || isNaN(parseFloat(negotiatedConsultationFee)) || parseFloat(negotiatedConsultationFee) <= 0) {
      return res.status(400).json({ error: 'Valid negotiated fee is required' });
    }
    
    const negotiation = await PaymentNegotiation.findById(id);
    if (!negotiation) {
      return res.status(404).json({ error: 'Payment negotiation not found' });
    }
    
    negotiation.negotiatedConsultationFee = parseFloat(negotiatedConsultationFee);
    negotiation.status = 'admin_approved';
    
    // Add to negotiation history
    negotiation.negotiationHistory.push({
      proposedBy: 'admin',
      amount: parseFloat(negotiatedConsultationFee),
      message: message || 'Admin fee negotiation',
      timestamp: new Date()
    });
    
    await negotiation.save();
    
    // Create notification for mentor
    const affiliation = await Affiliation.findById(negotiation.affiliationId);
    if (affiliation) {
      const notification = new Notification({
        userId: negotiation.mentorId,
        userRole: 'Mentor',
        title: 'New Fee Negotiation',
        description: `Admin has proposed a consultation fee of ${negotiatedConsultationFee} ${negotiation.currency}. Please review.`,
        link: '/payments',
      });
      
      await notification.save();
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Fee negotiation submitted successfully',
      negotiation 
    });
  } catch (error) {
    console.error('Error negotiating fee:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mentor responds to negotiation
const respondToNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, counterOffer, message } = req.body;
    
    if (!['accept', 'reject', 'counter'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response' });
    }
    
    const negotiation = await PaymentNegotiation.findById(id);
    if (!negotiation) {
      return res.status(404).json({ error: 'Payment negotiation not found' });
    }
    
    if (response === 'accept') {
      // Mentor accepts the negotiated fee
      negotiation.status = 'mentor_approved';
      negotiation.finalConsultationFee = negotiation.negotiatedConsultationFee;

      negotiation.negotiationHistory.push({
        proposedBy: 'mentor',
        amount: negotiation.finalConsultationFee,
        message: 'Mentor accepted the fee negotiation',
        timestamp: new Date()
      });
      
    } else if (response === 'reject') {
      // Mentor rejects the negotiation
      negotiation.status = 'rejected';
      
    } else if (response === 'counter') {
      // Mentor makes a counter offer
      if (!counterOffer || isNaN(parseFloat(counterOffer)) || parseFloat(counterOffer) <= 0) {
        return res.status(400).json({ error: 'Valid counter offer is required' });
      }
      
      // Update both the expected and negotiated consultation fee
      negotiation.expectedConsultationFee = parseFloat(counterOffer);
      negotiation.negotiatedConsultationFee = parseFloat(counterOffer);
      negotiation.status = 'pending'; // Reset to pending for admin to review
      
      // Add to negotiation history
      negotiation.negotiationHistory.push({
        proposedBy: 'mentor',
        amount: parseFloat(counterOffer),
        message: message || 'Mentor counter offer',
        timestamp: new Date()
      });
    }
    
    await negotiation.save();
    
    res.status(200).json({ 
      success: true, 
      message: `Negotiation ${response === 'counter' ? 'counter offer submitted' : response + 'ed'} successfully`,
      negotiation 
    });
  } catch (error) {
    console.error('Error responding to negotiation:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPayment,
  getNegotiationById,
  getMentorNegotiations,
  negotiateFee,
  respondToNegotiation,
};