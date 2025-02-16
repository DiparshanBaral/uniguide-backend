const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {type: String, default: 'admin'}
  },

  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Admin = db.model('Admin', adminSchema, 'Admin');

module.exports = { Admin };
