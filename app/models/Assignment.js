// models/Assignment.js
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: {
    score: Number,
    maxScore: Number,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    gradedAt: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const assignmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'essay', 'project', 'other'],
    default: 'other'
  },
  dueDate: {
    type: Date,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    maxDaysLate: {
      type: Number,
      min: 0,
      default: 7
    }
  },
  instructions: {
    type: String,
    required: true
  },
  resources: [{
    title: String,
    type: String,
    url: String
  }],
  rubric: [{
    criterion: String,
    points: Number,
    description: String
  }],
  submissions: [submissionSchema],
  visibleToStudents: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number, // in minutes, if applicable
    default: null
  },
  allowResubmission: {
    type: Boolean,
    default: false
  },
  maxAttempts: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
assignmentSchema.virtual('totalSubmissions').get(function() {
  return this.submissions?.length || 0;
});

assignmentSchema.virtual('averageScore').get(function() {
  if (!this.submissions?.length) return 0;
  const gradedSubmissions = this.submissions.filter(s => s.status === 'graded');
  if (!gradedSubmissions.length) return 0;
  const total = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade?.score || 0), 0);
  return total / gradedSubmissions.length;
});

// Indexes
assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ courseId: 1, status: 1 });

// Methods
assignmentSchema.methods.isOverdue = function() {
  return new Date() > this.dueDate;
};

assignmentSchema.methods.getStudentSubmission = function(studentId) {
  return this.submissions.find(sub => 
    sub.studentId.toString() === studentId.toString()
  );
};

// Statics
assignmentSchema.statics.getStudentAssignments = async function(studentId, courseId) {
  return this.find({
    courseId,
    visibleToStudents: true,
    'submissions.studentId': studentId
  }).select('-submissions');
};

assignmentSchema.statics.getCourseAssignmentStats = async function(courseId) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalAssignments: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        averageSubmissionRate: {
          $avg: {
            $divide: [
              { $size: '$submissions' },
              '$maxAttempts'
            ]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
  if (this.isModified('submissions')) {
    // Update submission status if past due date
    const now = new Date();
    this.submissions.forEach(submission => {
      if (!submission.isLate && submission.submittedAt > this.dueDate) {
        submission.isLate = true;
      }
    });
  }
  next();
});

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
export default Assignment;
