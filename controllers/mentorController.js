const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Mentor } = require('../models/mentorModel');

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
      profilePic: mentor.profilePic,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch mentor by ID
const getMentorProfile = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied. Unauthorized request.' });
    }

    const mentor = await Mentor.findById(req.user.id).select('-password');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.json(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all mentors
const getAllMentors = async (req, res) => {
  try {
    // Fetch all mentors from the database
    const mentors = await Mentor.find().select('-password'); // Exclude the password field

    // Check if there are no mentors
    if (!mentors || mentors.length === 0) {
      return res.status(404).json({ message: 'No mentors found' });
    }

    res.status(200).json({ success: true, data: mentors });
  } catch (error) {
    console.error('Error fetching all mentors:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch mentor by ID (Public: Accessible to students & mentors)
const getMentorPublicProfile = async (req, res) => {
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

// Update mentor information
const updateMentor = async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    profilePic,
    bio,
    expertise,
    degree,
    yearsOfExperience,
    paymentInformation,
    languages,
  } = req.body;

  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Update mentor details
    mentor.firstname = firstname || mentor.firstname;
    mentor.lastname = lastname || mentor.lastname;
    mentor.email = email || mentor.email;
    mentor.profilePic = profilePic || mentor.profilePic;
    mentor.bio = bio || mentor.bio;
    mentor.expertise = expertise || mentor.expertise;
    mentor.degree = degree || mentor.degree;
    mentor.yearsOfExperience = yearsOfExperience || mentor.yearsOfExperience;

    // Update payment information
    if (paymentInformation) {
      mentor.paymentInformation.amount =
        paymentInformation.amount || mentor.paymentInformation.amount;
      mentor.paymentInformation.currency =
        paymentInformation.currency || mentor.paymentInformation.currency;
    }

    // Update languages
    mentor.languages = languages || mentor.languages;

    // Check if a file was uploaded
    if (req.file) {
      mentor.profilePic = req.file.path;
    }

    const updatedMentor = await mentor.save(); // Trigger pre-save middleware

    res.status(200).json({
      message: 'Profile updated successfully',
      profileCompleted: updatedMentor.profileCompleted, // Include profile completion status
      _id: updatedMentor._id,
      firstname: updatedMentor.firstname,
      lastname: updatedMentor.lastname,
      email: updatedMentor.email,
      profilePic: updatedMentor.profilePic,
      bio: updatedMentor.bio,
      expertise: updatedMentor.expertise,
      degree: updatedMentor.degree,
      yearsOfExperience: updatedMentor.yearsOfExperience,
      paymentInformation: updatedMentor.paymentInformation,
      languages: updatedMentor.languages,
    });
  } catch (error) {
    console.error('Error updating mentor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update mentor password
const updateMentorPassword = async (req, res) => {
  const { mentorId, oldPassword, newPassword } = req.body;

  try {
    // Find the mentor by ID
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check if the old password matches
    const isMatch = await bcrypt.compare(oldPassword, mentor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    mentor.password = hashedPassword;
    await mentor.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//delete mentor by id
const deleteMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndDelete(req.params.id);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.status(200).json({ message: 'Mentor deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerMentor, loginMentor, getMentorProfile, getMentorPublicProfile, updateMentor, deleteMentorById, getAllMentors, updateMentorPassword };
