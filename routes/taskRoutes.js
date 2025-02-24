const express = require('express');
const {
  createTask,
  getTasksByCountry,
  deleteTask,
  addDefaultTasksByCountry,
} = require('../controllers/taskController');
const { protect, protectAdminRoute } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new task
router.post('/', protect, createTask);

// Get all tasks for a specific country
router.get('/country', protect, getTasksByCountry);


// Admin adds default tasks for a specific country
router.post('/default-tasks', protect, protectAdminRoute, addDefaultTasksByCountry);

module.exports = router;