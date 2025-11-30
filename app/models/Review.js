// models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
    maxLength: 1000
  },
  reply: {
    content: String,
    createdAt: Date
  },
  status: {
    type: String,
    enum: ['published', 'hidden'],
    default: 'published'
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  }
}, {
  timestamps: true
});

// Create compound index for unique reviews per student per course
reviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Static method to get course average rating
reviewSchema.statics.getCourseRating = async function(courseId) {
  const result = await this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  return result[0] || { averageRating: 0, totalReviews: 0 };
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
