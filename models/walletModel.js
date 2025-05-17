const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['Mentor', 'Admin']
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'usd'
    },
    transactions: [
      {
        amount: {
          type: Number,
          required: true
        },
        type: {
          type: String,
          enum: ['deposit', 'withdrawal'],
          required: true
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

// Use the Users database
const db = mongoose.connection.useDb('Users');

const Wallet = db.model("Wallet", walletSchema);
module.exports = Wallet;