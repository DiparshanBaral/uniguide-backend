const express = require('express');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  getPendingRooms,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  joinRoom,
  getJoinedRooms,
} = require('../controllers/discussionController');
const { protect, protectAdminRoute } = require('../middleware/authMiddleware')

const router = express.Router();

// Public route to get all rooms
router.get('/rooms', getAllRooms);

// Public route to get a single room by ID
router.get('/rooms/:id', getRoomById);

// Protected route to create a new room (requires authentication)
router.post('/create', protect, createRoom);

// Admin-only route to fetch pending room requests
router.get('/pending', protectAdminRoute, getPendingRooms);

// Admin-only route to approve or reject a room creation request
router.put('/:id/status', protectAdminRoute, updateRoomStatus);

// Protected route to update a room (requires authentication)
router.put('/rooms/update/:id', protect, updateRoom);

// Protected route to delete a room (requires authentication)
router.delete('/:id', protect, deleteRoom);

// Protected route to join a room
router.post('/:roomId/join', protect, joinRoom);

// Protected route to get all rooms joined by the user
router.get('/joined', protect, getJoinedRooms);

module.exports = router;