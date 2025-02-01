const jwt = require('jsonwebtoken');
const { Student, Mentor, Admin  } = require('../models/userModel');

// Middleware to protect routes (Students, Mentors, and Admins)
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user in the correct collection
    let user;
    if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'mentor') {
      user = await Mentor.findById(decoded.id).select('-password');
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user; // Attach the user object to the request
    next(); // Proceed to the next middleware/route
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Middleware to protect admin routes
const adminProtect = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Admin is authorized
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminProtect };
