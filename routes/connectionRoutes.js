const express = require("express");
const {
  applyForConnection,
  updateConnectionStatus,
  getPendingConnectionRequests,
  getApprovedConnections,
  getStudentPendingConnections,
  getStudentApprovedConnections,
} = require("../controllers/connectionController");
const { protect, protectMentorRoute, protectStudentRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// Student applies for mentor connection
router.post("/apply", protect, protectStudentRoute, applyForConnection);

// Mentor updates connection request (Approve/Reject)
router.put("/:id/status", protect, protectMentorRoute, updateConnectionStatus);

// Mentor fetches all pending connection requests
router.get("/pendingrequests", protect, protectMentorRoute, getPendingConnectionRequests);

// Mentor fetches all approved connections
router.get("/approvedconnections", protect, protectMentorRoute, getApprovedConnections);

// Student fetches all pending connections
router.get("/student/pendingconnections", protect, protectStudentRoute, getStudentPendingConnections);

// Student fetches all approved connections
router.get("/student/approvedconnections", protect, protectStudentRoute, getStudentApprovedConnections);

module.exports = router;