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
    enum: ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NRS', 'NPR']
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
      'nrs': 'NPR',
      'rs': 'NPR',
      'rupee': 'NPR',
      'rupees': 'NPR',
      'usd': 'USD',
      'gbp': 'GBP',
      'eur': 'EUR',
      'cad': 'CAD',
      'aud': 'AUD',
      'npr': 'NPR'
    };
    
    const normalized = (this.currency || '').toLowerCase();
    // Convert to uppercase after mapping
    this.currency = currencyMap[normalized] || normalized.toUpperCase();
  }
  
  next();
});

const PaymentNegotiation = usersDb.model('PaymentNegotiation', paymentNegotiationSchema);

module.exports = { PaymentNegotiation };