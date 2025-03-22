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
const protectStudentRoute = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from 'Authorization' header

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role || decoded.role !== 'student') {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    // Find the student user in the database
    const student = await Student.findById(decoded.id).select('-password');

    if (!student) {
      return res.status(401).json({ message: 'Not authorized, student not found' });
    }

    // Attach the student user to the request object
    req.student = student; // Use `req.student` to differentiate from other roles
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

// Middleware to protect mentor routes
const protectMentorRoute = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from 'Authorization' header

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role || decoded.role !== 'mentor') {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    // Find the mentor user in the database
    const mentor = await Mentor.findById(decoded.id).select('-password');

    if (!mentor) {
      return res.status(401).json({ message: 'Not authorized, mentor not found' });
    }

    // Attach the mentor user to the request object
    req.mentor = mentor; // Use `req.mentor` to differentiate from other roles
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

// Middleware to protect admin routes
const protectAdminRoute = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from 'Authorization' header

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role || decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    // Find the admin user in the database
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }

    // Attach the admin user to the request object
    req.admin = admin; // Use `req.admin` to differentiate from `req.user` in other middleware
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


module.exports = { protect, protectStudentRoute, protectMentorRoute, protectAdminRoute };
