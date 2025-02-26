const { Portal } = require('../models/portalModel');

// Add a task to the portal
const addTask = async (req, res) => {
  try {
    const { portalId } = req.params;
    const { title, description, dueDate } = req.body;

    // Validate required fields
    if (!portalId || !title || !description || !dueDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find the portal
    const portal = await Portal.findById(portalId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    // Add the task
    portal.tasks.push({ title, description, dueDate });
    await portal.save();

    res.status(200).json({ message: 'Task added successfully', portal });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: error.message || 'An error occurred while adding the task' });
  }
};

// Update a task's details
const updateTask = async (req, res) => {
  try {
    const { portalId, taskId, title, description, dueDate, taskStatus } = req.body;

    if (!portalId || !taskId) {
      return res.status(400).json({ error: 'Portal ID and Task ID are required' });
    }

    const portal = await Portal.findById(portalId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    const task = portal.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.taskStatus = taskStatus || task.taskStatus;

    await portal.save();

    res.status(200).json({ message: 'Task updated successfully', portal });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message || 'An error occurred while updating the task' });
  }
};

  
  // Get all tasks for a portal
  const getAllTasks = async (req, res) => {
    try {
      const { portalId } = req.query;
  
      // Validate required field
      if (!portalId) {
        return res.status(400).json({ error: 'Portal ID is required' });
      }
  
      // Find the portal
      const portal = await Portal.findById(portalId);
      if (!portal) {
        return res.status(404).json({ error: 'Portal not found' });
      }
  
      // Return all tasks in the portal
      res.status(200).json({ tasks: portal.tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: error.message || 'An error occurred while fetching tasks' });
    }
  };

  
// Update a task's status
const updateTaskStatus = async (req, res) => {
  try {
    const { portalId, taskId, taskStatus } = req.body; 

    // Validate required fields
    if (!portalId || !taskId || !taskStatus) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find the portal
    const portal = await Portal.findById(portalId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    // Find the task and update its taskStatus
    const task = portal.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.taskStatus = taskStatus; // Change status to taskStatus
    await portal.save();

    res.status(200).json({ message: 'Task status updated successfully', portal });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: error.message || 'An error occurred while updating the task status' });
  }
};


// Upload a document to the portal
const uploadDocument = async (req, res) => {
  try {
    const { portalId, title, url, uploadedBy } = req.body;

    // Validate required fields
    if (!portalId || !title || !url || !uploadedBy) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find the portal
    const portal = await Portal.findById(portalId);
    if (!portal) {
      return res.status(404).json({ error: 'Portal not found' });
    }

    // Add the document
    portal.documents.push({ title, url, uploadedBy });
    await portal.save();

    res.status(200).json({ message: 'Document uploaded successfully', portal });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message || 'An error occurred while uploading the document' });
  }
};

// Delete a task from the portal
const deleteTask = async (req, res) => {
    try {
      const { portalId, taskId } = req.body;
  
      // Validate required fields
      if (!portalId || !taskId) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      // Find the portal
      const portal = await Portal.findById(portalId);
      if (!portal) {
        return res.status(404).json({ error: 'Portal not found' });
      }
  
      // Find the task and remove it
      const taskIndex = portal.tasks.findIndex((task) => task._id.toString() === taskId);
      if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found in the portal' });
      }
  
      // Remove the task from the tasks array
      portal.tasks.splice(taskIndex, 1);
  
      // Save the updated portal
      await portal.save();
  
      res.status(200).json({ message: 'Task deleted successfully', portal });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: error.message || 'An error occurred while deleting the task' });
    }
  };

module.exports = {
  addTask,
  updateTaskStatus,
  uploadDocument,
  deleteTask,
  getAllTasks,
  updateTask,
};