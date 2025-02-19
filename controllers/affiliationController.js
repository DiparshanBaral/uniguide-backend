const Affiliation = require('../models/affiliationModel');
const { upload } = require('../config/cloudinaryConfig');
const Mentor = require('../models/mentorModel').Mentor;
const { USUniversity, UKUniversity, CanadaUniversity, AustraliaUniversity } = require('../models/universityModel');

const universityModels = {
  US: USUniversity,
  UK: UKUniversity,
  Canada: CanadaUniversity,
  Australia: AustraliaUniversity,
};

// Mentor submits an affiliation request with document upload
const applyForAffiliation = async (req, res) => {
  try {
      const { mentorId, universityId, universityLocation, description } = req.body;

      // Ensure the file was uploaded successfully
      if (!req.file?.path) {
          return res.status(400).json({ error: "Document is required" });
      }

      // Validate required fields
      if (!mentorId || !universityId || !universityLocation || !description) {
          return res.status(400).json({ error: "All fields are required" });
      }

      // Check if the mentor already has a pending affiliation request
      const existingRequest = await Affiliation.findOne({
          mentorId,
          status: "Pending",
      });

      if (existingRequest) {
          return res.status(400).json({ error: "You have already submitted a pending affiliation request." });
      }

      // Save the affiliation request
      const affiliation = new Affiliation({
          mentorId,
          universityId,
          universityLocation,
          documentUrl: req.file.path,
          description,
          status: "Pending",
      });

      await affiliation.save();
      res.status(201).json({ message: "Affiliation request submitted successfully", affiliation });
  } catch (error) {
      console.error("Error in applyForAffiliation: ", JSON.stringify(error, null, 2));

      if (error.name === "ValidationError") {
          return res.status(400).json({ error: "Validation error: " + error.message });
      }

      res.status(500).json({ error: error.message || "An error occurred during the affiliation process" });
  }
};

  

// Admin Approves or Rejects Request
const updateAffiliationStatus = async (req, res) => {
  try {
    const { status } = req.body; // Get the status (Approved or Rejected)
    const { id } = req.params; // Get the Affiliation ID

    // Validate the provided status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the affiliation request by ID
    const affiliation = await Affiliation.findById(id);
    if (!affiliation) {
      return res.status(404).json({ error: 'Affiliation request not found' });
    }

    // If the request is approved, update the mentor's university and isApproved field
    if (status === 'Approved') {
      const mentorId = affiliation.mentorId; // Get the mentor ID from the affiliation
      const universityId = affiliation.universityId; // Get the university ID

      // Find the university to get its name
      const university = await universityModels[affiliation.universityLocation].findById(universityId);
      if (!university) {
        return res.status(404).json({ error: 'University not found' });
      }

      // Update the mentor with the university name and set isApproved to true
      await Mentor.findByIdAndUpdate(mentorId, 
        { 
          university: university.name, 
          isApproved: true 
        }, 
        { new: true }
      );
    }

    // Update the status of the affiliation request
    affiliation.status = status;
    await affiliation.save();

    // Respond with the updated status
    res.status(200).json({ message: `Affiliation ${status.toLowerCase()} successfully`, affiliation });
  } catch (error) {
    console.error('Error updating affiliation status: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};




// Get all pending requests
const getAllAffiliationRequests = async (req, res) => {
  try {
    const requests = await Affiliation.find({ status: "Pending" })
      .populate({
        path: "mentorId",
        model: Mentor, // Directly use the imported Mentor model
        select: "firstname lastname email",
      })  
      .lean(); // Convert to a plain object to modify `universityId`

    // Manually populate the universityId field based on universityLocation
    for (const request of requests) {
      const UniversityModel = universityModels[request.universityLocation];
      if (UniversityModel) {
        request.universityId = await UniversityModel.findById(request.universityId).select("name location");
      }
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching affiliation requests: ", JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all approved requests
const getAllApprovedAffiliationRequests = async (req, res) => {
  try {
    const requests = await Affiliation.find({ status: "Approved" })
      .populate({
        path: "mentorId",
        model: Mentor, // Directly use the imported Mentor model
        select: "firstname lastname email",
      })  
      .lean(); // Convert to a plain object to modify `universityId`

    // Manually populate the universityId field based on universityLocation
    for (const request of requests) {
      const UniversityModel = universityModels[request.universityLocation];
      if (UniversityModel) {
        request.universityId = await UniversityModel.findById(request.universityId).select("name location");
      }
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching approved affiliation requests: ", JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};


module.exports = { applyForAffiliation, updateAffiliationStatus, getAllAffiliationRequests, getAllApprovedAffiliationRequests };
