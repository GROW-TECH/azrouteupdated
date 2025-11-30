import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  progressRequired: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reward: String
});

const learningGoalSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['course_completion', 'study_hours', 'certificates']
  },
  description: String,
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  targetHours: {
    type: Number,
    min: 0
  },
  targetCertificates: {
    type: Number,
    min: 0
  },
  milestones: [milestoneSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Ensure courseId is required for course_completion goals
learningGoalSchema.pre('save', function(next) {
  if (this.type === 'course_completion' && !this.courseId) {
    next(new Error('courseId is required for course_completion goals'));
  }
  if (this.type === 'study_hours' && !this.targetHours) {
    next(new Error('targetHours is required for study_hours goals'));
  }
  if (this.type === 'certificates' && !this.targetCertificates) {
    next(new Error('targetCertificates is required for certificates goals'));
  }
  next();
});

const LearningGoal = mongoose.models.LearningGoal || mongoose.model('LearningGoal', learningGoalSchema);

export default LearningGoal;
