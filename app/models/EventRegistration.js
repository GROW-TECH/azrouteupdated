// models/EventRegistration.js
import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketTier: {
      id: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'attended'],
      default: 'confirmed'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attendedAt: Date,
    cancellationReason: String,
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    refundId: String,
    refundedAt: Date,
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentInfo: {
    amount: Number,
    transactionId: String,
    paymentMethod: String,
    paymentDate: Date,
    status: String
  },
  attendanceStatus: {
    type: String,
    enum: ['registered', 'attended', 'no-show'],
    default: 'registered'
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: String,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  additionalInfo: {
    dietary: String,
    specialRequirements: String,
    questions: [{
      question: String,
      answer: String
    }]
  },
  checkinTime: Date,
  checkoutTime: Date
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

// Indexes for efficient querying
eventRegistrationSchema.index({ eventId: 1, status: 1 });
eventRegistrationSchema.index({ studentId: 1, status: 1 });

// Methods
eventRegistrationSchema.methods.issueRefund = async function() {
  // Implement refund logic here
  this.status = 'refunded';
  await this.save();
};

eventRegistrationSchema.methods.issueCertificate = async function(certificateUrl) {
  this.certificateIssued = true;
  this.certificateUrl = certificateUrl;
  await this.save();
};

// Statics
eventRegistrationSchema.statics.getEventAttendance = async function(eventId) {
  return this.aggregate([
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$attendanceStatus',
        count: { $sum: 1 }
      }
    }
  ]);
};

const EventRegistration = mongoose.models.EventRegistration || 
  mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
