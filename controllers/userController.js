const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Student, Mentor } = require('../models/userModel');

// Register a new user
const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  try {
    // Check if user already exists in either collection
    const existingStudent = await Student.findOne({ email });
    const existingMentor = await Mentor.findOne({ email });
    if (existingStudent || existingMentor) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user based on role
    let newUser;
    if (role === 'student') {
      newUser = await Student.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
      });
    } else if (role === 'mentor') {
      newUser = await Mentor.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Return success response
    res.status(201).json({
      message: 'User created successfully',
      _id: newUser.id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Authenticate a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check both collections for the user
    let user = await Student.findOne({ email });
    if (!user) {
      user = await Mentor.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Compare passwords
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Include role in the payload
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return success response
    res.json({
      message: `Welcome back, ${user.firstname}!`,
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch user by ID
const getUserById = async (req, res) => {
  try {
    let user;

    // If user is authenticated (i.e., req.user is populated by protect middleware)
    if (req.user) {
      if (req.user.role === 'student') {
        user = await Student.findById(req.params.id).select('-password');
      } else if (req.user.role === 'mentor') {
        user = await Mentor.findById(req.params.id).select('-password');
      }
    } else {
      // If no token provided, fallback to public route, and try finding user in the User collection
      user = await Student.findById(req.params.id).select('-password');  // Default to student model
      if (!user) {
        user = await Mentor.findById(req.params.id).select('-password');  // Check mentor model if not found in student
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error); // Log error for debugging purposes
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Update user details
const updateUser = async (req, res) => {
  const { firstname, lastname, email, profilePic } = req.body;

  try {
    let user;
    if (req.user.role === 'student') {
      user = await Student.findById(req.params.id);
    } else if (req.user.role === 'mentor') {
      user = await Mentor.findById(req.params.id);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.email = email || user.email;
    user.profilePic = profilePic || user.profilePic;

    // Save the updated user
    const updatedUser = await user.save();

    // Return success response
    res.status(200).json({
      message: 'Profile updated successfully',
      _id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserById, updateUser };