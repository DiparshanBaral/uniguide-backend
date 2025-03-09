const express = require('express');
const {
  addTask,
  updateTaskStatus,
  uploadDocument,
  deleteTask,
  updateTask,
  getAllTasks,
} = require('../controllers/portalController');
const { protect, protectMentorRoute, protectStudentRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Add a task to the portal
router.post('/:portalId/tasks', protect, protectMentorRoute, addTask);

// Update a task's details
router.put('/updatetask', protect, protectMentorRoute, updateTask);

// Get all tasks for a portal
router.get('/tasks', protect, getAllTasks);

// Update a task's status
router.put('/task/status', protect, protectStudentRoute, updateTaskStatus);

// Upload a document to the portal
router.post('/:portalId/documents', protect, protectMentorRoute, uploadDocument);

// Delete a task from the portal
router.delete('/task/delete', protect, protectMentorRoute, deleteTask);

module.exports = router;