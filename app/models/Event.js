// models/Event.js
import mongoose from 'mongoose';

const ticketTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  maxAttendees: {
    type: Number,
    required: true,
    min: 1
  },
  benefits: [{
    type: String,
    trim: true
  }],
  availableCount: {
    type: Number,
    min: 0
  }
});

const eventSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['workshop', 'conference', 'webinar', 'bootcamp', 'masterclass', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  location: {
    type: {
      type: String,
      enum: ['online', 'physical', 'hybrid'],
      required: true
    },
    venue: String,
    address: String,
    city: String,
    country: String,
    meetingLink: String,
    meetingPlatform: {
      type: String,
      enum: ['zoom', 'meet', 'teams', 'other']
    }
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  ticketTiers: [ticketTierSchema],
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  agenda: [{
    time: String,
    title: String,
    description: String
  }],
  speakers: [{
    name: String,
    bio: String,
    avatar: String,
    designation: String,
    company: String
  }],
  resources: [{
    title: String,
    type: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  maximumRegistrations: {
    type: Number,
    required: true
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  isRefundable: {
    type: Boolean,
    default: false
  },
  refundPolicy: {
    type: String
  },
  certificateProvided: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return now <= this.registrationDeadline && 
         this.currentRegistrations < this.maximumRegistrations &&
         this.status === 'published';
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return now < this.startDate && this.status === 'published';
});

// Middleware to validate dates
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  if (this.registrationDeadline > this.startDate) {
    next(new Error('Registration deadline must be before event start date'));
  }
  next();
});

// Indexes
eventSchema.index({ teacherId: 1, startDate: -1 });
eventSchema.index({ status: 1, startDate: -1 });
eventSchema.index({ 
  title: 'text', 
  description: 'text', 
  'speakers.name': 'text' 
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
