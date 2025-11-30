// app/models/Registration.js
import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    default: 'pending'
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
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ userId: 1, status: 1 });

const Registration = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);

export default Registration;
