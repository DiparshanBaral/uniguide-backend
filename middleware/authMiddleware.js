const jwt = require('jsonwebtoken');
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');
const { Admin } = require('../models/adminModel');

// Middleware to protect general routes (students, mentors, admins)
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from 'Authorization' header

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

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

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token expired' });
    }

    res.status(500).json({ message: 'Server error, token verification failed' });
  }
};

// Middleware to protect student routes
const protectStudentRoute = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Students only.' });
  }
};

// Middleware to protect mentor routes
const protectMentorRoute = (req, res, next) => {
  if (req.user && req.user.role === 'mentor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Mentors only.' });
  }
};

// Middleware to protect admin routes
const protectAdminRoute = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, protectStudentRoute, protectMentorRoute, protectAdminRoute };
