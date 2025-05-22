const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');
const jwt = require('jsonwebtoken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Update this line to match the route in googleAuthRoutes.js
      // callbackURL: 'http://localhost:5000/auth/google/callback',
      callbackURL: 'https://uni-guide-frontend-git-main-diparshanbarals-projects.vercel.app/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const { emails, photos, name } = profile;
        
        // Check if email is available
        if (!emails || emails.length === 0) {
          return done(null, false, { message: "Email information is required but was not provided by Google." });
        }
        
        const email = emails[0].value;
        const profilePic = photos?.[0]?.value || "";
        const firstname = name?.givenName || email.split('@')[0];
        const lastname = name?.familyName || "";
        
        // Get role and action from multiple possible sources (priority order)
        let role, action;
        
        // 1. Try to get from state (most reliable in OAuth flows)
        if (req.query.state) {
          try {
            const state = JSON.parse(req.query.state);
            role = state.role;
            action = state.action;
          } catch (err) {
            console.error("Failed to parse state:", err);
          }
        }
        
        // 2. Try to get from session
        if (!role && req.session) {
          role = req.session.role;
          action = req.session.action;
        }
        
        // 3. Try to get from URL params/query
        if (!role) {
          role = req.params.role || req.query.role;
          action = req.query.action;
        }

        // Special handling for "auto" role during login
        if (role === "auto" && action === "login") {
          // Check both collections to find the user
          const studentUser = await Student.findOne({ email });
          const mentorUser = await Mentor.findOne({ email });
          
          if (studentUser) {
            // User found in student collection
            role = "student";
            user = studentUser;
          } else if (mentorUser) {
            // User found in mentor collection
            role = "mentor";
            user = mentorUser;
          } else {
            // User doesn't exist in either collection - redirect to signup
            return done(null, false, { 
              message: "Account not found. Please sign up first.",
              redirectTo: "signup" 
            });
          }
        } else if (role !== "student" && role !== "mentor") {
          return done(null, false, { message: "Invalid or missing role parameter." });
        } else {
          // Normal signup or login with explicit role
          let model = role === "student" ? Student : Mentor;
          
          if (action === "signup") {
            // Add this marker for Google-authenticated users
            const newUser = {
              firstname,
              lastname,
              email,
              profilePic,
              password: '[GOOGLE_AUTH_USER]'  // Add this placeholder for Google users
            };
            
            // Create the user with the model
            user = await model.create(newUser);
          } else {
            user = await model.findOneAndUpdate(
              { email },
              { firstname, lastname, profilePic },
              { new: true, upsert: action === "signup" }
            );
          }
          
          if (!user) {
            return done(null, false, { message: "User not found or invalid role." });
          }
        }

        done(null, { user, role });
      } catch (error) {
        console.error("Google auth error:", error);
        done(error);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, { id: user.user._id, role: user.role });
});

// Deserialize user
passport.deserializeUser(async ({ id, role }, done) => {
  try {
    let user;
    if (role === 'student') {
      user = await Student.findById(id).select('-password');
    } else if (role === 'mentor') {
      user = await Mentor.findById(id).select('-password');
    }

    if (!user) {
      return done(null, false);
    }

    done(null, { user, role });
  } catch (error) {
    done(error);
  }
});

module.exports = passport;