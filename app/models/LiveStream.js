// models/LiveStream.js

import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Teacher', 'Student']
  },
  userName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'question', 'announcement'],
    default: 'chat'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  reactions: [{
    userId: mongoose.Schema.Types.ObjectId,
    type: String
  }]
});

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Teacher', 'Student']
  },
  userName: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    required: true
  },
  leftAt: Date,
  role: {
    type: String,
    enum: ['host', 'co-host', 'participant'],
    default: 'participant'
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  }
});

const recordingSchema = new mongoose.Schema({
  filename: String,
  url: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  size: Number,
  format: String,
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  }
});

const livestreamSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  teacherName: {
    type: String,
    // required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['native', 'zoom', 'meet', 'teams'],
    default: 'native'
  },
  status: {
    type: String,
    enum: ['created', 'scheduled', 'live', 'ended'],
    default: 'created'
  },
  scheduledFor: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    isChatEnabled: {
      type: Boolean,
      default: true
    },
    isQuestionsEnabled: {
      type: Boolean,
      default: true
    },
    isRecordingEnabled: {
      type: Boolean,
      default: true
    },
    allowReplays: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 100
    },
    requireRegistration: {
      type: Boolean,
      default: false
    },
    waitingRoom: {
      type: Boolean,
      default: false
    },
    // External meeting settings
    platform: {
      type: String,
      enum: ['zoom', 'meet', 'teams', null],
      default: null
    },
    meetingUrl: String,
    meetingId: String,
    passcode: String
  },
  participants: [participantSchema],
  chat: [chatMessageSchema],
  recordings: [recordingSchema],
  statistics: {
    totalViews: {
      type: Number,
      default: 0
    },
    peakConcurrent: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0
    },
    totalInteractions: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
livestreamSchema.index({ status: 1, scheduledFor: 1 });
livestreamSchema.index({ teacherId: 1, status: 1 });
livestreamSchema.index({ courseId: 1, status: 1 });
livestreamSchema.index({ type: 1, status: 1 });
livestreamSchema.index({ 'participants.userId': 1 });
livestreamSchema.index({ isPublic: 1, status: 1 });

// Virtual for active participant count
livestreamSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt).length;
});

// Methods
livestreamSchema.methods.isActive = function() {
  return this.status === 'live';
};

livestreamSchema.methods.canJoin = function(userId) {
  if (!this.isActive()) return false;
  if (this.settings.maxParticipants <= this.activeParticipants) return false;
  return true;
};

export const LiveStream = mongoose.models.LiveStream || mongoose.model('LiveStream', livestreamSchema);
