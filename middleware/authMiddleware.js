const jwt = require('jsonwebtoken');
const { Student, Mentor } = require('../models/userModel');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the correct collection based on role
    let user;
    if (decoded.role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'mentor') {
      user = await Mentor.findById(decoded.id).select('-password');
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

module.exports = { protect };