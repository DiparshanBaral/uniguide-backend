const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models/userModel");

const SECRET_KEY = "your_secret_key"; // Replace with a secure key

// Admin Login
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET_KEY, { expiresIn: "2h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { loginAdmin };
