const mongoose = require('mongoose');

// Use the 'Users' database for negotiations
const usersDb = mongoose.connection.useDb('Users');

const paymentNegotiationSchema = new mongoose.Schema({
  affiliationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliation',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  expectedConsultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  negotiatedConsultationFee: {
    type: Number,
    min: 0,
    default: null
  },
  finalConsultationFee: {
    type: Number,
    min: 0,
    default: null
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NRS']
  },
  status: {
    type: String,
    enum: ['pending', 'admin_approved', 'mentor_approved', 'rejected'],
    default: 'pending'
  },
  negotiationHistory: [
    {
      proposedBy: {
        type: String,
        enum: ['admin', 'mentor'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      message: {
        type: String,
        default: ''
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

paymentNegotiationSchema.pre('save', function(next) {
  // Normalize the currency code
  if (this.currency) {
    const currencyMap = {
      'nrs': 'npr',
      'rs': 'inr',
      'rupee': 'inr',
      'rupees': 'inr'
    };
    
    const normalized = (this.currency || '').toLowerCase();
    this.currency = currencyMap[normalized] || normalized;
  }
  
  next();
});

const PaymentNegotiation = usersDb.model('PaymentNegotiation', paymentNegotiationSchema);

module.exports = { PaymentNegotiation };