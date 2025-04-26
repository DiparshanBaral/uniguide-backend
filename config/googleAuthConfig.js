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
      callbackURL: 'http://localhost:5000/auth/google/callback',
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
        const role = req.query.role; // Get role from query parameter
        const action = req.query.action; // Get action (login or signup)

        if (!role || (role !== "student" && role !== "mentor")) {
          return done(null, false, { message: "Invalid or missing role parameter." });
        }

        let user;
        if (role === "student") {
          user = await Student.findOneAndUpdate(
            { email },
            { firstname, lastname, profilePic },
            { new: true, upsert: action === "signup" }
          );
        } else if (role === "mentor") {
          user = await Mentor.findOneAndUpdate(
            { email },
            { firstname, lastname, profilePic },
            { new: true, upsert: action === "signup" }
          );
        }

        if (!user) {
          return done(null, false, { message: "User not found or invalid role." });
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