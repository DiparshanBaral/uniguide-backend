const { DiscussionRoom } = require('../models/discussionModel');
const { Room } = require('../models/roomModel');
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await DiscussionRoom.find();
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await DiscussionRoom.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { title, description, tags, category } = req.body;

    const newRoom = new DiscussionRoom({
      title,
      description,
      tags,
      category,
      status: 'pending', // Set status to pending by default
    });

    const savedRoom = await newRoom.save();
    res.status(201).json({ success: true, data: savedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a room
exports.updateRoom = async (req, res) => {
  try {
    const { title, description, tags, category, status } = req.body;

    const updatedRoom = await DiscussionRoom.findByIdAndUpdate(
      req.params.id,
      { title, description, tags, category, status },
      { new: true, runValidators: true },
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or Reject a Room (Admin Only)
exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate the status value
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updatedRoom = await DiscussionRoom.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const deletedRoom = await DiscussionRoom.findByIdAndDelete(req.params.id);

    if (!deletedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin approves or rejects a room creation request
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params; // Room ID
    const { status } = req.body; // New status: 'approved' or 'rejected'

    // Validate the status value
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be "approved" or "rejected".',
      });
    }

    const updatedRoom = await DiscussionRoom.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // If the room is approved, create it in the Room database
    if (status === 'approved') {
      const newRoom = new Room({ roomId: updatedRoom._id, posts: [] });
      await newRoom.save();
    }

    res.status(200).json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all pending rooms (Admin-only)
exports.getPendingRooms = async (req, res) => {
  try {
    // Fetch rooms with status "pending"
    const pendingRooms = await DiscussionRoom.find({ status: 'pending' });

    // Return the list of pending rooms
    res.status(200).json({
      success: true,
      data: pendingRooms,
    });
  } catch (error) {
    console.error('Error fetching pending rooms:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Join a room
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Check if the user exists in either Student or Mentor collection
    const student = await Student.findById(userId);
    const mentor = await Mentor.findById(userId);

    if (!student && !mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the room and check if the user is already joined
    const room = await DiscussionRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if the user is already in the joinedUsers array
    if (room.joinedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already joined this room' });
    }

    // Add the user to the joinedUsers array
    room.joinedUsers.push(userId);
    room.participants += 1; // Increment the participant count
    await room.save();

    res.status(200).json({ success: true, message: 'Successfully joined the room', data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all rooms joined by the user
exports.getJoinedRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Check if the user exists in either Student or Mentor collection
    const student = await Student.findById(userId);
    const mentor = await Mentor.findById(userId);

    if (!student && !mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch rooms where the user's ID is in the joinedUsers array
    const joinedRooms = await DiscussionRoom.find({ joinedUsers: userId });

    res.status(200).json({ success: true, data: joinedRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
