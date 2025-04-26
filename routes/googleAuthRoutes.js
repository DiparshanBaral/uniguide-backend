const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Set role in session before Google auth
router.get('/google/:role', (req, res, next) => {
  const { role, action } = req.query;
  
  if (!role || (role !== 'student' && role !== 'mentor')) {
    return res.status(400).redirect('http://localhost:5173/login?error=invalid_role');
  }
  
  // Store role and action in session
  req.session.role = role;
  req.session.action = action;
  
  // Explicitly request email scope
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force account selection to avoid auto-login with wrong account
  })(req, res, next);
});

// Google auth callback
router.get('/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/login?error=auth_failed', 
    session: false 
  }),
  (req, res) => {
    const { user, role } = req.user;

    if (!user) {
      return res.redirect('http://localhost:5173/login?error=user_not_found');
    }

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
      profilePic: user.profilePic,
    };

    // Redirect to frontend with session data
    res.redirect(`http://localhost:5173/auth/success?data=${encodeURIComponent(JSON.stringify(session))}`);
  }
);

module.exports = router;