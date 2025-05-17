const { PaymentNegotiation } = require('../models/paymentNegotiationModel');
const Affiliation = require('../models/affiliationModel');
const { Mentor } = require('../models/mentorModel');
const { Notification } = require('../models/notificationModel');
const {
  USUniversity,
  UKUniversity,
  CanadaUniversity,
  AustraliaUniversity,
} = require('../models/universityModel');

const universityModels = {
  US: USUniversity,
  UK: UKUniversity,
  Canada: CanadaUniversity,
  Australia: AustraliaUniversity,
};

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

// Get negotiations by connection ID
const getNegotiationsByConnectionId = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const mongoose = require('mongoose');
    
    // Validate the connection ID format
    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid connection ID format' 
      });
    }
    
    // Import the Connection model correctly using destructuring (if it's exported that way)
    // or directly if it's the default export
    const connectionModule = require('../models/connectionModel');
    // Handle both export styles: module.exports = Connection or module.exports = { Connection }
    const Connection = connectionModule.Connection || connectionModule;
    
    if (!Connection || typeof Connection.findById !== 'function') {
      throw new Error('Connection model not properly imported');
    }
    
    // Find the connection and populate mentorId
    const connection = await Connection.findById(connectionId).populate('mentorId');
    
    if (!connection) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    // Safely handle the mentorId regardless of whether it's populated or not
    const mentorId = connection.mentorId instanceof mongoose.Types.ObjectId 
      ? connection.mentorId
      : (connection.mentorId && connection.mentorId._id 
          ? connection.mentorId._id 
          : connection.mentorId);
    
    if (!mentorId) {
      return res.status(400).json({
        success: false,
        error: 'Connection does not have a valid mentor ID'
      });
    }
    
    // Find negotiations for this mentor
    const negotiations = await PaymentNegotiation.find({ 
      mentorId: mentorId 
    }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      negotiations: negotiations || [] 
    });
  } catch (error) {
    console.error('Error fetching connection negotiations:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Admin negotiates fee
const negotiateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { negotiatedConsultationFee, message, isApproval } = req.body;
    
    if (!negotiatedConsultationFee || isNaN(parseFloat(negotiatedConsultationFee)) || parseFloat(negotiatedConsultationFee) <= 0) {
      return res.status(400).json({ error: 'Valid negotiated fee is required' });
    }
    
    const negotiation = await PaymentNegotiation.findById(id);
    if (!negotiation) {
      return res.status(404).json({ error: 'Payment negotiation not found' });
    }
    
    // If the admin is approving a counter offer from the mentor
    if (isApproval) {
      // Set the final consultation fee and status to approved
      negotiation.finalConsultationFee = parseFloat(negotiatedConsultationFee);
      negotiation.status = 'mentor_approved'; // Same status as when mentor accepts
      
      // Add to negotiation history
      negotiation.negotiationHistory.push({
        proposedBy: 'admin',
        amount: parseFloat(negotiatedConsultationFee),
        message: message || 'Admin accepted counter offer',
        timestamp: new Date()
      });
      
      // Update the affiliation status to Approved
      const affiliation = await Affiliation.findById(negotiation.affiliationId);
      if (affiliation && affiliation.status !== 'Approved') {
        affiliation.status = 'Approved';
        
        // Get university information
        const UniversityModel = universityModels[affiliation.universityLocation];
        if (UniversityModel) {
          const university = await UniversityModel.findById(affiliation.universityId);
          if (university) {
            // Update mentor with university name and negotiated fee
            await Mentor.findByIdAndUpdate(
              negotiation.mentorId,
              {
                university: university.name,
                isApproved: true,
                consultationFee: negotiation.finalConsultationFee,
                currency: negotiation.currency
              }
            );
            
            // Add mentor to university's affiliatedMentors array if not already there
            if (!university.affiliatedMentors.includes(negotiation.mentorId)) {
              university.affiliatedMentors.push(negotiation.mentorId);
              await university.save();
            }
            
            // Create notification for mentor
            const notification = new Notification({
              userId: negotiation.mentorId,
              userRole: 'Mentor',
              title: 'Affiliation Approved',
              description: `Your affiliation with ${university.name} has been approved with a consultation fee of ${negotiation.finalConsultationFee} ${negotiation.currency}.`,
              link: '/payments',
            });
            
            await notification.save();
          }
        }
        
        await affiliation.save();
      }
    } else {
      // This is a regular negotiation (initial or counter to mentor's counter)
      negotiation.negotiatedConsultationFee = parseFloat(negotiatedConsultationFee);
      negotiation.status = 'admin_approved';
      
      // Add to negotiation history
      negotiation.negotiationHistory.push({
        proposedBy: 'admin',
        amount: parseFloat(negotiatedConsultationFee),
        message: message || 'Admin fee negotiation',
        timestamp: new Date()
      });
      
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
    }
    
    await negotiation.save();
    
    res.status(200).json({ 
      success: true, 
      message: isApproval ? 'Counter offer accepted successfully' : 'Fee negotiation submitted successfully',
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
      
      // Also update the affiliation status to Approved if it's not already
      const affiliation = await Affiliation.findById(negotiation.affiliationId);
      if (affiliation && affiliation.status !== 'Approved') {
        affiliation.status = 'Approved';
        
        // Get university information
        const UniversityModel = universityModels[affiliation.universityLocation];
        if (UniversityModel) {
          const university = await UniversityModel.findById(affiliation.universityId);
          if (university) {
            // Update mentor with university name and negotiated fee
            await Mentor.findByIdAndUpdate(
              negotiation.mentorId,
              {
                university: university.name,
                isApproved: true,
                consultationFee: negotiation.finalConsultationFee,
                currency: negotiation.currency
              }
            );
            
            // Add mentor to university's affiliatedMentors array if not already there
            if (!university.affiliatedMentors.includes(negotiation.mentorId)) {
              university.affiliatedMentors.push(negotiation.mentorId);
              await university.save();
            }
            
            // Create notification for mentor
            const notification = new Notification({
              userId: negotiation.mentorId,
              userRole: 'Mentor',
              title: 'Affiliation Approved',
              description: `Your affiliation with ${university.name} has been approved with a consultation fee of ${negotiation.finalConsultationFee} ${negotiation.currency}.`,
              link: '/payments',
            });
            
            await notification.save();
          }
        }
        
        await affiliation.save();
      }
    } else if (response === 'reject') {
      // Mentor rejects the negotiation
      negotiation.status = 'rejected';
      
      // Create notification for admin
      const notification = new Notification({
        userId: process.env.ADMIN_ID,
        userRole: 'Admin',
        title: 'Fee Negotiation Rejected',
        description: 'Mentor has rejected the proposed consultation fee.',
        link: '/admin/affiliations',
      });
      
      await notification.save();
      
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
  getNegotiationsByConnectionId,
  negotiateFee,
  respondToNegotiation,
};