const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Set role in session before Google auth
router.get('/student', (req, res, next) => {
  req.session.role = 'student';
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/mentor', (req, res, next) => {
  req.session.role = 'mentor';
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google auth callback
router.get('/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login', session: false }),
  (req, res) => {
    const { user, role } = req.user;
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create session data
    const session = {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: role,
      token: token,
      profilePic: user.profilePic
    };
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/success?data=${encodeURIComponent(JSON.stringify(session))}`);
  }
);

module.exports = router;