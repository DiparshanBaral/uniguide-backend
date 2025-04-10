const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models/adminModel");
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');
const { Room } = require('../models/roomModel');
const {
  USUniversity,
  UKUniversity,
  CanadaUniversity,
  AustraliaUniversity,
} = require('../models/universityModel');

const SECRET_KEY = "UniGuideJWT";

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET_KEY, { expiresIn: "12h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Controller to fetch counts
const getCounts = async (req, res) => {
  try {
    // Fetch counts from respective collections
    const universityCount =
      (await USUniversity.countDocuments()) +
      (await UKUniversity.countDocuments()) +
      (await CanadaUniversity.countDocuments()) +
      (await AustraliaUniversity.countDocuments());

    const mentorCount = await Mentor.countDocuments();
    const studentCount = await Student.countDocuments();
    const discussionRoomCount = await Room.countDocuments();

    // Return the counts
    res.status(200).json({
      success: true,
      data: {
        universityCount,
        mentorCount,
        studentCount,
        discussionRoomCount,
      },
    });
  } catch (error) {
    console.error('Error fetching counts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  loginAdmin,
  getCounts, // Export the new controller
};
