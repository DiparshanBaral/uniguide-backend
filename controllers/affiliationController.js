const Affiliation = require('../models/affiliationModel');
const { upload } = require('../config/cloudinaryConfig');


// Mentor submits an affiliation request with document upload
const applyForAffiliation = async (req, res) => {
    try {
      const { mentorId, universityId, universityLocation, description } = req.body;
  
      // Ensure the file was uploaded successfully
      if (!req.file || !req.file.path) {
        return res.status(400).json({ error: "Document is required" });
      }
  
      // Validate required fields
      if (!mentorId || !universityId || !universityLocation || !description) {
        return res.status(400).json({ error: "All fields are required" });
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
  
      res
        .status(500)
        .json({ error: error.message || "An error occurred during the affiliation process" });
    }
  };
  

// Admin Approves or Rejects Request
const updateAffiliationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params; // Affiliation ID

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const affiliation = await Affiliation.findById(id);
    if (!affiliation) {
      return res.status(404).json({ error: 'Affiliation request not found' });
    }

    affiliation.status = status;
    await affiliation.save();

    res.status(200).json({ message: `Affiliation ${status.toLowerCase()}`, affiliation });
  } catch (error) {
    console.error('Error updating affiliation status: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all pending requests
const getAllAffiliationRequests = async (req, res) => {
    try {
      // Fetch only Pending affiliation requests
      const requests = await Affiliation.find({ status: "Pending" })
        .populate("mentorId", "firstname lastname email")  // Fetch mentor details
        .populate({
          path: "universityId",
          select: "name location", // Select necessary fields
          model: function (doc) {
            // Dynamically determine university model based on universityLocation
            switch (doc.universityLocation) {
              case "US":
                return "USUniversity";
              case "UK":
                return "UKUniversity";
              case "Canada":
                return "CanadaUniversity";
              case "Australia":
                return "AustraliaUniversity";
              default:
                return null;
            }
          },
        });
  
      res.status(200).json(requests);
    } catch (error) {
      console.error("Error fetching affiliation requests: ", JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message });
    }
  };
  

module.exports = { applyForAffiliation, updateAffiliationStatus, getAllAffiliationRequests };
