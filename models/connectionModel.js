const mongoose = require("mongoose");
const { Mentor } = require('./mentorModel');
const { Student } = require('./studentModel');

// Use the 'Users' database for connections
const usersDb = mongoose.connection.useDb('Users');

// Connection Schema Definition
const connectionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Student, 
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Mentor,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
    },
  },
  { timestamps: true }
);

const Connection = usersDb.model("Connection", connectionSchema, "Connections");

module.exports = {  Connection }