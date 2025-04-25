const Affiliation = require('../models/affiliationModel');
const { PaymentNegotiation } = require('../models/paymentNegotiationModel');
const { upload } = require('../config/cloudinaryConfig');
const Mentor = require('../models/mentorModel').Mentor;
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

// Mentor submits an affiliation request with document upload and payment details
const applyForAffiliation = async (req, res) => {
  try {
    const { mentorId, universityId, universityLocation, description, expectedConsultationFee, currency } = req.body;

    // Ensure the file was uploaded successfully
    if (!req.file?.path) {
      return res.status(400).json({ error: 'Document is required' });
    }

    // Validate required fields
    if (!mentorId || !universityId || !universityLocation || !description || !expectedConsultationFee || !currency) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the mentor already has a pending affiliation request
    const existingRequest = await Affiliation.findOne({
      mentorId,
      status: 'Pending',
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ error: 'You have already submitted a pending affiliation request.' });
    }

    // Save the affiliation request
    const affiliation = new Affiliation({
      mentorId,
      universityId,
      universityLocation,
      documentUrl: req.file.path,
      description,
      status: 'Pending',
    });

    const savedAffiliation = await affiliation.save();

    // Create payment negotiation record
    const paymentNegotiation = new PaymentNegotiation({
      affiliationId: savedAffiliation._id,
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

    const savedPaymentNegotiation = await paymentNegotiation.save();

    // Update affiliation with payment negotiation ID
    savedAffiliation.paymentNegotiationId = savedPaymentNegotiation._id;
    await savedAffiliation.save();

    res.status(201).json({ 
      message: 'Affiliation request submitted successfully', 
      affiliation: savedAffiliation,
      paymentNegotiation: savedPaymentNegotiation
    });
  } catch (error) {
    console.error('Error in applyForAffiliation: ', JSON.stringify(error, null, 2));

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error: ' + error.message });
    }

    res
      .status(500)
      .json({ error: error.message || 'An error occurred during the affiliation process' });
  }
};

// Admin Approves or Rejects Request with negotiated fee
const updateAffiliationStatus = async (req, res) => {
  try {
    const { status, negotiatedConsultationFee, message } = req.body; // Get status and fee info
    const { id } = req.params; // Get the Affiliation ID

    // Validate the provided status
    if (!['Approved', 'Rejected', 'Pending_Mentor_Approval'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the affiliation request by ID
    const affiliation = await Affiliation.findById(id);
    if (!affiliation) {
      return res.status(404).json({ error: 'Affiliation request not found' });
    }

    // If status is Pending_Mentor_Approval, we need negotiated fee
    if (status === 'Pending_Mentor_Approval' && !negotiatedConsultationFee) {
      return res.status(400).json({ error: 'Negotiated fee is required for approval' });
    }

    // Update the payment negotiation record if exists
    if (affiliation.paymentNegotiationId) {
      const paymentNegotiation = await PaymentNegotiation.findById(affiliation.paymentNegotiationId);
      
      if (paymentNegotiation) {
        if (status === 'Pending_Mentor_Approval') {
          paymentNegotiation.negotiatedConsultationFee = negotiatedConsultationFee;
          paymentNegotiation.status = 'admin_approved';
          
          // Add to negotiation history
          paymentNegotiation.negotiationHistory.push({
            proposedBy: 'admin',
            amount: negotiatedConsultationFee,
            message: message || 'Admin fee negotiation',
            timestamp: new Date()
          });
          
          await paymentNegotiation.save();
          
          // Create notification for mentor
          const notification = new Notification({
            userId: affiliation.mentorId,
            userRole: 'Mentor',
            title: 'Affiliation Fee Negotiated',
            description: `Admin has negotiated your consultation fee to ${negotiatedConsultationFee} ${paymentNegotiation.currency}. Please review and approve.`,
            link: '/payments',
          });
          
          await notification.save();
        } else if (status === 'Rejected') {
          paymentNegotiation.status = 'rejected';
          await paymentNegotiation.save();
        }
      }
    }

    // If the request is directly approved (rare case without negotiation)
    if (status === 'Approved') {
      const mentorId = affiliation.mentorId; // Get the mentor ID
      const universityId = affiliation.universityId; // Get the university ID

      // Find the university to get its name
      const university = await universityModels[affiliation.universityLocation].findById(
        universityId,
      );
      if (!university) {
        return res.status(404).json({ error: 'University not found' });
      }

      // Update the mentor with the university name and set isApproved to true
      await Mentor.findByIdAndUpdate(
        mentorId,
        {
          university: university.name,
          isApproved: true,
        },
        { new: true },
      );

      // Update the university's affiliatedMentors array
      university.affiliatedMentors.push(mentorId);
      await university.save();
      
      // Create notification for mentor
      const notification = new Notification({
        userId: mentorId,
        userRole: 'Mentor',
        title: 'Affiliation Approved',
        description: `Your affiliation with ${university.name} has been approved.`,
        link: '/mentordashboard',
      });
      
      await notification.save();
    } else if (status === 'Rejected') {
      // Create notification for mentor
      const notification = new Notification({
        userId: affiliation.mentorId,
        userRole: 'Mentor',
        title: 'Affiliation Rejected',
        description: 'Your affiliation request has been rejected by the admin.',
        link: '/mentordashboard',
      });
      
      await notification.save();
    }

    // Update the status of the affiliation request
    affiliation.status = status;
    await affiliation.save();

    // Respond with the updated status
    res
      .status(200)
      .json({ message: `Affiliation ${status.toLowerCase()} successfully`, affiliation });
  } catch (error) {
    console.error('Error updating affiliation status: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all pending requests
const getAllAffiliationRequests = async (req, res) => {
  try {
    const requests = await Affiliation.find({ status: 'Pending' })
      .populate({
        path: 'mentorId',
        model: Mentor, // Directly use the imported Mentor model
        select: 'firstname lastname email profilePic',
      })
      .populate('paymentNegotiationId')
      .lean(); // Convert to a plain object to modify `universityId`

    // Manually populate the universityId field based on universityLocation
    for (const request of requests) {
      const UniversityModel = universityModels[request.universityLocation];
      if (UniversityModel) {
        request.universityId = await UniversityModel.findById(request.universityId).select(
          'name location',
        );
      }
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching affiliation requests: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all approved requests
const getAllApprovedAffiliationRequests = async (req, res) => {
  try {
    const requests = await Affiliation.find({ status: 'Approved' })
      .populate({
        path: 'mentorId',
        model: Mentor, // Directly use the imported Mentor model
        select: 'firstname lastname email profilePic',
      })
      .lean(); // Convert to a plain object to modify `universityId`

    // Manually populate the universityId field based on universityLocation
    for (const request of requests) {
      const UniversityModel = universityModels[request.universityLocation];
      if (UniversityModel) {
        request.universityId = await UniversityModel.findById(request.universityId).select(
          'name location',
        );
      }
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching approved affiliation requests: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Delete an affiliation request by ID
const deleteAffiliation = async (req, res) => {
  try {
    const { id } = req.params; // Get affiliation ID from request parameters

    // Find and delete the affiliation request
    const affiliation = await Affiliation.findByIdAndDelete(id);

    if (!affiliation) {
      return res.status(404).json({ error: 'Affiliation request not found' });
    }

    res.status(200).json({ message: 'Affiliation request deleted successfully' });
  } catch (error) {
    console.error('Error deleting affiliation request: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  applyForAffiliation,
  updateAffiliationStatus,
  getAllAffiliationRequests,
  getAllApprovedAffiliationRequests,
  deleteAffiliation,
};
