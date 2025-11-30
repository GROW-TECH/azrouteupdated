// models/Course.js

import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,  // in seconds
    required: true
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'file']
    },
    url: String
  }],
  order: {
    type: Number,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  order: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema]
});

const reviewSchema = new mongoose.Schema({
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
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  previewVideo: String,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  discountedPrice: Number,
  discountEnds: Date,
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  subcategory: String,
  tags: [String],
  language: {
    type: String,
    default: 'English'
  },
  requirements: [String],
  objectives: [String],
  sections: [sectionSchema],
  totalDuration: {
    type: Number,  // in seconds
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  completionCriteria: {
    minWatchPercentage: {
      type: Number,
      default: 80
    },
    requireQuizzes: {
      type: Boolean,
      default: false
    },
    minQuizScore: {
      type: Number,
      default: 70
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ teacherId: 1, status: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ status: 1, featured: 1 });

// Pre-save hook to calculate totals
courseSchema.pre('save', function(next) {
  if (this.isModified('sections')) {
    let totalDuration = 0;
    let totalLessons = 0;

    this.sections.forEach(section => {
      totalLessons += section.lessons.length;
      section.lessons.forEach(lesson => {
        totalDuration += lesson.duration || 0;
      });
    });

    this.totalDuration = totalDuration;
    this.totalLessons = totalLessons;
  }
  next();
});

// Instance method to calculate rating
courseSchema.methods.calculateRating = async function() {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = totalRating / this.reviews.length;
    this.totalRatings = this.reviews.length;
    await this.save();
  }
};

// Create slug from title
courseSchema.pre('validate', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  next();
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
