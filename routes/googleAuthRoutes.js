const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Update the callback route with improved error handling

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, userData, info) => {
    // Handle errors
    if (err) {
      console.error('Authentication error:', err);
      return res.redirect('http://localhost:5173/login?error=auth_error');
    }
    
    // Check for account not found case (new user trying to login)
    if (!userData && info && info.redirectTo === "signup") {
      console.log('New user detected - redirecting to signup');
      return res.redirect('http://localhost:5173/signup?error=no_account_found');
    }
    
    // Handle general authentication failure
    if (!userData) {
      console.log('Authentication failed:', info?.message);
      return res.redirect('http://localhost:5173/login?error=auth_failed');
    }
    
    // Authentication successful - proceed with login
    const { user, role } = userData;
    
    console.log(`Auth successful for: ${user.email}, role: ${role}`);

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
  })(req, res, next);
});

// Update the initial auth route to accept the "auto" role
router.get('/google/:role', (req, res, next) => {
  const role = req.params.role;
  const { action } = req.query;
  
  console.log(`Google auth initiated for role: ${role}, action: ${action}`);
  
  // Allow "auto" role for login, or student/mentor roles for signup
  if ((action === "login" && role === "auto") || 
      (action === "signup" && (role === "student" || role === "mentor"))) {
    
    req.session = req.session || {};
    req.session.role = role;
    req.session.action = action;
    
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state: JSON.stringify({ role, action })
    })(req, res, next);
  } else {
    return res.status(400).redirect('http://localhost:5173/login?error=invalid_role_or_action');
  }
});

module.exports = router;