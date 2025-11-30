// models/CourseEnrollment.js
import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  watchTime: {
    type: Number,
    default: 0
  },
  lastWatched: Date
});

const courseEnrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'refunded', 'cancelled'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: Date,
  progress: {
    type: Number,
    default: 0
  },
  lessonsProgress: [progressSchema],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    url: String,
    issuedAt: Date
  },
  paymentInfo: {
    amount: Number,
    currency: {
      type: String,
      default: 'GBP'
    },
    stripePaymentId: String,
    stripeSessionId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date
  },
  refundInfo: {
    refundedAt: Date,
    amount: Number,
    reason: String,
    stripeRefundId: String
  }
}, {
  timestamps: true
});

// Indexes
courseEnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
courseEnrollmentSchema.index({ courseId: 1, status: 1 });
courseEnrollmentSchema.index({ studentId: 1, status: 1 });

// Methods
courseEnrollmentSchema.methods.updateProgress = async function() {
  const completedLessons = this.lessonsProgress.filter(p => p.completed).length;
  const totalLessons = this.lessonsProgress.length;
  this.progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  if (this.progress === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  }
  
  await this.save();
};

courseEnrollmentSchema.methods.issueCertificate = async function(certificateUrl) {
  if (this.progress === 100) {
    this.certificate = {
      issued: true,
      url: certificateUrl,
      issuedAt: new Date()
    };
    await this.save();
    return true;
  }
  return false;
};

const CourseEnrollment = mongoose.models.CourseEnrollment || 
  mongoose.model('CourseEnrollment', courseEnrollmentSchema);

export default CourseEnrollment;
