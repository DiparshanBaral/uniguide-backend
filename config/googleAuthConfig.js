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
        const { id, emails, photos, name } = profile;
        const email = emails[0].value;
        const profilePic = photos[0].value; // Use Google profile picture
        const firstname = name.givenName; // Extract first name
        const lastname = name.familyName; // Extract last name

        let user;
        if (req.session.role === 'student') {
          user = await Student.findOneAndUpdate(
            { email },
            { firstname, lastname, profilePic }, // Update firstname, lastname, and profilePic
            { new: true, upsert: true }
          );
        } else if (req.session.role === 'mentor') {
          user = await Mentor.findOneAndUpdate(
            { email },
            { firstname, lastname, profilePic }, // Update firstname, lastname, and profilePic
            { new: true, upsert: true }
          );
        }

        done(null, { user, role: req.session.role });
      } catch (error) {
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