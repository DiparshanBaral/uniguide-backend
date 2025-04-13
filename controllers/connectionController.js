const { Connection } = require('../models/connectionModel');
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');
const { Portal } = require('../models/portalModel');
const { Task } = require('../models/taskModel');
const { Notification } = require('../models/notificationModel');
const {
  USUniversity,
  UKUniversity,
  CanadaUniversity,
  AustraliaUniversity,
} = require('../models/universityModel');

// Create a mapping for university models
const universityModels = {
  US: USUniversity,
  UK: UKUniversity,
  Canada: CanadaUniversity,
  Australia: AustraliaUniversity,
};

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
      return res
        .status(400)
        .json({ error: 'You have already submitted a pending connection request to this mentor.' });
    }

    // Save the connection request
    const connection = new Connection({
      studentId,
      mentorId,
      description,
      status: 'Pending',
    });

    await connection.save();

    // Create a notification for the mentor
    const notification = new Notification({
      userId: mentorId,
      userRole: 'Mentor',
      title: 'New Connection Request',
      description: 'A student has sent you a connection request.',
      link: '/mentordashboard',
    });

    await notification.save();

    res.status(201).json({ message: 'Connection request submitted successfully', connection });
  } catch (error) {
    console.error('Error in applyForConnection:', error.message);
    res.status(500).json({ error: error.message || 'An error occurred during the connection process' });
  }
};

// Mentor Approves or Rejects Connection Request
const updateConnectionStatus = async (req, res) => {
  try {
    const { status, id } = req.body; // Get the status (Approved or Rejected)

    // Validate the status field
    if (!status) {
      return res.status(400).json({ error: 'Status field is required in the request body' });
    }

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

      // Create a notification for the student
      const notification = new Notification({
        userId: studentId,
        userRole: 'Student',
        title: 'Connection Request Approved',
        description: 'Your connection request has been approved by the mentor.',
        link: '/studentdashboard',
      });

      await notification.save();

      // Fetch the mentor to get their university name
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found' });
      }

      const universityName = mentor.university;
      
      // Determine the mentor's country using the university name
      let country = null;
      for (const [key, UniversityModel] of Object.entries(universityModels)) {
        const university = await UniversityModel.findOne({ name: universityName });
        console.log(`Checking in ${key} universities:`, university);
        if (university) {
          country = university.country; // Use the 'country' field instead of 'location'
          break;
        }
      }

      if (!country || !['US', 'UK', 'Canada', 'Australia'].includes(country)) {
        console.error('Invalid university country:', country);
        return res.status(400).json({ error: 'Mentor does not have a valid university country' });
      }

      // Fetch default tasks for the specified country
      const defaultTasks = await Task.find({ country }).lean();

      // Ensure tasks are not empty
      if (!defaultTasks || defaultTasks.length === 0) {
        return res.status(400).json({ error: "No default tasks found for the mentor's country" });
      }

      // Add student to mentor's connectedStudents list
      await Mentor.findByIdAndUpdate(
        mentorId,
        { $addToSet: { connectedStudents: studentId } },
        { new: true },
      );

      // Add mentor to student's connectedMentors list
      await Student.findByIdAndUpdate(
        studentId,
        { $addToSet: { connectedMentors: mentorId } },
        { new: true },
      );

      // Create a new portal for the student-mentor pair
      const portal = new Portal({
        studentId,
        mentorId,
        country,
        applicationStatus: 'In Progress',
        tasks: defaultTasks.map((task) => ({
          taskId: task._id,
          title: task.title,
          description: task.description,
          taskStatus: 'Pending',
        })),
        documents: [],
      });

      // Save the portal
      const savedPortal = await portal.save();

      // Update the connection with the portalId and status
      await Connection.findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          portalId: savedPortal._id,
        },
        { new: true },
      );
    } else {
      // If the request is rejected, simply update the status
      await Connection.findByIdAndUpdate(id, { status: 'Rejected' }, { new: true });
    }

    // Respond with the updated status
    res.status(200).json({ message: `Connection ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error updating connection status:', error.stack);
    res
      .status(500)
      .json({ error: error.message || 'An error occurred while updating the connection status' });
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
        select: 'firstname lastname email profilePic major',
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
        select: 'firstname lastname email profilePic major bio',
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
        select: 'firstname lastname email profilePic university degree yearsOfExperience',
      })
      .lean();

    res.status(200).json(connections);
  } catch (error) {
    console.error(
      'Error fetching pending connections for student: ',
      JSON.stringify(error, null, 2),
    );
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
        select: 'firstname lastname email profilePic university expertise degree yearsOfExperience',
      })
      .lean();

    res.status(200).json(connections);
  } catch (error) {
    console.error(
      'Error fetching approved connections for student: ',
      JSON.stringify(error, null, 2),
    );
    res.status(500).json({ error: error.message });
  }
};

// Delete a connection by ID
const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the connection by ID
    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const { studentId, mentorId, status } = connection;

    // If the connection was approved, update the connected lists
    if (status === 'Approved') {
      // Remove student from mentor's connectedStudents list
      await Mentor.findByIdAndUpdate(
        mentorId,
        { $pull: { connectedStudents: studentId } },
        { new: true },
      );

      // Remove mentor from student's connectedMentors list
      await Student.findByIdAndUpdate(
        studentId,
        { $pull: { connectedMentors: mentorId } },
        { new: true },
      );
    }

    // Delete the connection
    await Connection.findByIdAndDelete(id);

    res.status(200).json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res
      .status(500)
      .json({ error: error.message || 'An error occurred while deleting the connection' });
  }
};

module.exports = {
  applyForConnection,
  updateConnectionStatus,
  getPendingConnectionRequests,
  getApprovedConnections,
  getStudentPendingConnections,
  getStudentApprovedConnections,
  deleteConnection,
};
