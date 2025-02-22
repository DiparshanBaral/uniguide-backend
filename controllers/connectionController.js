const Connection = require('../models/connectionModel');
const { Student } = require('../models/studentModel'); // Import Student model
const { Mentor } = require('../models/mentorModel'); // Import Mentor model

// Student applies for mentor connection
const applyForConnection = async (req, res) => {
  try {
    const { studentId, mentorId, description } = req.body;

    // Validate required fields
    if (!studentId || !mentorId || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the student already has a pending connection request with this mentor
    const existingRequest = await Connection.findOne({
      studentId,
      mentorId,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You have already submitted a pending connection request to this mentor.' });
    }

    // Save the connection request
    const connection = new Connection({
      studentId,
      mentorId,
      description,
      status: 'Pending',
    });

    await connection.save();
    res.status(201).json({ message: 'Connection request submitted successfully', connection });
  } catch (error) {
    console.error('Error in applyForConnection: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message || 'An error occurred during the connection process' });
  }
};

// Mentor Approves or Rejects Connection Request
const updateConnectionStatus = async (req, res) => {
  try {
    const { status } = req.body; // Get the status (Approved or Rejected)
    const { id } = req.params; // Get the Connection ID

    // Validate the provided status
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the connection request by ID
    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // If the request is approved, update the mentor's and student's connected lists
    if (status === 'Approved') {
      const { studentId, mentorId } = connection;

      // Add student to mentor's connectedStudents list
      await Mentor.findByIdAndUpdate(
        mentorId,
        { $addToSet: { connectedStudents: studentId } },
        { new: true }
      );

      // Add mentor to student's connectedMentors list
      await Student.findByIdAndUpdate(
        studentId,
        { $addToSet: { connectedMentors: mentorId } },
        { new: true }
      );
    }

    // Update the status of the connection request
    connection.status = status;
    await connection.save();

    // Respond with the updated status
    res.status(200).json({ message: `Connection ${status.toLowerCase()} successfully`, connection });
  } catch (error) {
    console.error('Error updating connection status: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all pending connection requests for a mentor
const getPendingConnectionRequests = async (req, res) => {
  try {
    const { mentorId } = req.query;

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID is required' });
    }

    const requests = await Connection.find({ mentorId, status: 'Pending' })
      .populate({
        path: 'studentId',
        model: Student, // Directly use the imported Student model
        select: 'firstname lastname email profilePic',
      })
      .lean();

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching pending connection requests: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all approved connections for a mentor
const getApprovedConnections = async (req, res) => {
  try {
    const { mentorId } = req.query;

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID is required' });
    }

    const connections = await Connection.find({ mentorId, status: 'Approved' })
      .populate({
        path: 'studentId',
        model: Student, // Directly use the imported Student model
        select: 'firstname lastname email profilePic',
      })
      .lean();

    res.status(200).json(connections);
  } catch (error) {
    console.error('Error fetching approved connections: ', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
};

// Get all pending connections for a student
const getStudentPendingConnections = async (req, res) => {
    try {
      const { studentId } = req.query;
  
      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }
  
      const connections = await Connection.find({ studentId, status: 'Pending' })
        .populate({
          path: 'mentorId',
          model: Mentor, // Directly use the imported Mentor model
          select: 'firstname lastname email profilePic',
        })
        .lean();
  
      res.status(200).json(connections);
    } catch (error) {
      console.error('Error fetching pending connections for student: ', JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message });
    }
  };

  // Get all approved connections for a student
const getStudentApprovedConnections = async (req, res) => {
    try {
      const { studentId } = req.query;
  
      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }
  
      const connections = await Connection.find({ studentId, status: 'Approved' })
        .populate({
          path: 'mentorId',
          model: Mentor, // Directly use the imported Mentor model
          select: 'firstname lastname email profilePic',
        })
        .lean();
  
      res.status(200).json(connections);
    } catch (error) {
      console.error('Error fetching approved connections for student: ', JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.message });
    }
  };

module.exports = {
  applyForConnection,
  updateConnectionStatus,
  getPendingConnectionRequests,
  getApprovedConnections,
  getStudentPendingConnections,
  getStudentApprovedConnections,
};