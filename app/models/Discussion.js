// models/Discussion.js

import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorType'
  },
  authorType: {
    type: String,
    required: true,
    enum: ['Student', 'Teacher']
  },
  content: {
    type: String,
    required: true
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    userId: mongoose.Schema.Types.ObjectId,
    voteType: String // 'up' or 'down'
  }],
  isTeacherResponse: {
    type: Boolean,
    default: false
  },
  authorDetails: {
    firstName: String,
    lastName: String,
    department: String,
    profileImage: String
  },
  attachments: [{
    type: String,
    url: String,
    name: String
  }]
}, {
  timestamps: true
});

const discussionSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false // Optional, for lesson-specific discussions
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorType'
  },
  authorType: {
    type: String,
    required: true,
    enum: ['Student', 'Teacher']
  },
  authorDetails: {
    firstName: String,
    lastName: String,
    department: String,
    profileImage: String,
    qualification: String
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['question', 'discussion', 'announcement'],
    default: 'discussion'
  },
  tags: [String],
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    userId: mongoose.Schema.Types.ObjectId,
    voteType: String // 'up' or 'down'
  }],
  views: {
    type: Number,
    default: 0
  },
  solved: {
    type: Boolean,
    default: false
  },
  pinned: {
    type: Boolean,
    default: false
  },
  teacherPinned: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String,
    url: String,
    name: String
  }],
  replies: [replySchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'reported'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
discussionSchema.index({ courseId: 1, type: 1, status: 1 });
discussionSchema.index({ courseId: 1, lessonId: 1, status: 1 });
discussionSchema.index({ courseId: 1, authorId: 1 });
discussionSchema.index({ title: 'text', content: 'text' });

// Update lastActivity on new replies
discussionSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.lastActivity = new Date();
  }
  next();
});

// Virtual for reply count
discussionSchema.virtual('replyCount').get(function() {
  return this.replies?.length || 0;
});

// Method to add a reply
discussionSchema.methods.addReply = async function(reply) {
  // Set isTeacherResponse if author is a teacher
  if (reply.authorType === 'Teacher') {
    reply.isTeacherResponse = true;
  }
  
  this.replies.push(reply);
  this.lastActivity = new Date();
  return this.save();
};

// Method to vote
discussionSchema.methods.vote = async function(userId, voteType) {
  const existingVote = this.voters.find(v => v.userId.equals(userId));
  
  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Remove vote
      this.voters = this.voters.filter(v => !v.userId.equals(userId));
      this.votes += voteType === 'up' ? -1 : 1;
    } else {
      // Change vote
      existingVote.voteType = voteType;
      this.votes += voteType === 'up' ? 2 : -2;
    }
  } else {
    // Add new vote
    this.voters.push({ userId, voteType });
    this.votes += voteType === 'up' ? 1 : -1;
  }

  return this.save();
};

// Method to get full author name
discussionSchema.methods.getAuthorName = function() {
  return this.authorDetails ? 
    `${this.authorDetails.firstName} ${this.authorDetails.lastName}` : 
    'Unknown User';
};

// Static method to find discussions by teacher
discussionSchema.statics.findByTeacher = function(teacherId) {
  return this.find({
    authorId: teacherId,
    authorType: 'Teacher'
  }).sort({ createdAt: -1 });
};

const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', discussionSchema);

export default Discussion;
