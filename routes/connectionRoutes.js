const express = require("express");
const {
  applyForConnection,
  updateConnectionStatus,
  getPendingConnectionRequests,
  getApprovedConnections,
  getStudentPendingConnections,
  getStudentApprovedConnections,
  deleteConnection,
  getConnectionById,
} = require("../controllers/connectionController");
const { protect, protectMentorRoute, protectStudentRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// Student applies for mentor connection
router.post("/apply", protect, protectStudentRoute, applyForConnection);

// Mentor updates connection request (Approve/Reject)
router.put("/status", protect, updateConnectionStatus);

// Mentor fetches all pending connection requests
router.get("/pendingrequests", protect, protectMentorRoute, getPendingConnectionRequests);

// Mentor fetches all approved connections
router.get("/approvedconnections", protect, getApprovedConnections);

// Student fetches all pending connections
router.get("/student/pendingconnections", protect, protectStudentRoute, getStudentPendingConnections);

// Student fetches all approved connections
router.get("/student/approvedconnections", protect, protectStudentRoute, getStudentApprovedConnections);

//get specific connection by id
router.get("/specificConnection", protect, getConnectionById);

// Delete a connection by ID
router.delete('/:id', protect, deleteConnection);

module.exports = router;