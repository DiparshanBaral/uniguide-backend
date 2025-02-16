const express = require("express");
const { upload } = require("../config/cloudinaryConfig");
const { applyForAffiliation, updateAffiliationStatus, getAllAffiliationRequests } = require("../controllers/affiliationController");
const { protect, protectAdminRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// Mentor applies for affiliation (Document Upload)
router.post("/apply", protect, upload.single("document"), applyForAffiliation); 

// Admin updates affiliation request (Approve/Reject)
router.put("/:id/status", protect, protectAdminRoute, updateAffiliationStatus);

// Admin fetches all requests
router.get("/pendingrequests", protect, protectAdminRoute, getAllAffiliationRequests);

module.exports = router;
