// models/payment.model.js
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const paymentSchema = new mongoose.Schema(
  {
    payment_uuid: {
      type: String,
      unique: true,
      required: true,
      default: () => uuidv4(),
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connection",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Use the Users database
const db = mongoose.connection.useDb('Users');

const Payment = db.model("Payment", paymentSchema);
module.exports = Payment;