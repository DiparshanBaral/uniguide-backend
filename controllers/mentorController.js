const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/mentorModel');

// Register a new mentor
const registerMentor = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;
  
    try {
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      // Check if mentor already exists
      const existingMentor = await Mentor.findOne({ email });
      if (existingMentor) {
        return res.status(400).json({ message: "Mentor already exists" });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new mentor with basic details
      const newMentor = await Mentor.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
      });
  
      res.status(201).json({
        message: "Mentor registered successfully",
        _id: newMentor.id,
        firstname: newMentor.firstname,
        lastname: newMentor.lastname,
        email: newMentor.email,
      });
    } catch (error) {
      console.error("Error registering mentor:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

// Authenticate a mentor
const loginMentor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const mentor = await Mentor.findOne({ email });
    if (!mentor) {
      return res.status(401).json({ message: 'Mentor not found' });
    }

    const matchPassword = await bcrypt.compare(password, mentor.password);
    if (!matchPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: mentor._id, role: 'mentor' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: `Welcome back, ${mentor.firstname}!`,
      _id: mentor._id,
      firstname: mentor.firstname,
      lastname: mentor.lastname,
      email: mentor.email,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch mentor by ID
const getMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).select('-password');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.json(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update mentor details
const updateMentor = async (req, res) => {
  const { firstname, lastname, email, profilePic, bio, expertise, university, degree, yearsOfExperience } = req.body;

  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    mentor.firstname = firstname || mentor.firstname;
    mentor.lastname = lastname || mentor.lastname;
    mentor.email = email || mentor.email;
    mentor.profilePic = profilePic || mentor.profilePic;
    mentor.bio = bio || mentor.bio;
    mentor.expertise = expertise || mentor.expertise;
    mentor.university = university || mentor.university;
    mentor.degree = degree || mentor.degree;
    mentor.yearsOfExperience = yearsOfExperience || mentor.yearsOfExperience;

    const updatedMentor = await mentor.save();

    res.status(200).json({ message: 'Profile updated successfully', updatedMentor });
  } catch (error) {
    console.error('Error updating mentor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerMentor, loginMentor, getMentorById, updateMentor };
