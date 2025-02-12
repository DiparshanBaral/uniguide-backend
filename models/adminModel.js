const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const db = mongoose.connection.useDb('Users');
const Admin = db.model('Admin', adminSchema, 'Admins');

module.exports = { Admin };
