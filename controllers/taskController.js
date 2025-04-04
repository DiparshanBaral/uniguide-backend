const { Task } = require('../models/taskModel');

// Create a new task
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, country } = req.body;

    // Validate required fields
    if (!title || !description || !dueDate || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Save the task
    const task = new Task({
      title,
      description,
      dueDate,
      country,
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'An error occurred while creating the task' });
  }
};

// Add default tasks for a specific country (Admin-only route)
const addDefaultTasksByCountry = async (req, res) => {
  try {
    const { country, tasks } = req.body;

    // Validate required fields
    if (!country || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'Country and tasks array are required' });
    }

    // Validate each task in the array
    for (const task of tasks) {
      if (!task.title || !task.description) {
        return res.status(400).json({ error: 'Each task must have a title and description' });
      }
    }

    // Save all tasks to the database
    const savedTasks = await Task.insertMany(
      tasks.map((task) => ({
        title: task.title,
        description: task.description,
        country,
      }))
    );

    res.status(201).json({
      message: `Default tasks added successfully for ${country}`,
      tasks: savedTasks,
    });
  } catch (error) {
    console.error('Error adding default tasks:', error);
    res.status(500).json({ error: error.message || 'An error occurred while adding default tasks' });
  }
};


module.exports = {
  createTask,
  addDefaultTasksByCountry,
};