const mongoose = require('mongoose');
const {Mentor} = require("./mentorModel");
const {Student} = require("./studentModel");

// Connection Schema Definition sup
// yo yo yo yo yo
const connectionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Student,
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Mentor,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      default: null,
    },
  },
  { timestamps: true }
);

// Use the 'Users' database for connections
const usersDb = mongoose.connection.useDb('Users');

// Create the Connection model
const Connection = usersDb.model('Connection', connectionSchema, 'Connections');

module.exports = { Connection };