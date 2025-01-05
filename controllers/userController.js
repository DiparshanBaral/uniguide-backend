const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// Register a new user
const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      role,
    });

    if (newUser) {
      res.status(201).json({
        message: 'User created successfully',
        _id: newUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    // Enhanced error handling
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.message });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

// Authenticate a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      const matchPassword = await bcrypt.compare(password, user.password);
      if (matchPassword) {
        res.json({
          message: `Welcome back, ${user.firstname}!`,
          _id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
