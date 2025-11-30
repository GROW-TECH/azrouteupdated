// models/Teacher.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TeacherSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [10, 'Password must be at least 10 characters'],
    validate: {
      validator: function(v) {
        return /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?{}]).{10,}$/.test(v);
      },
      message: 'Password must have 10+ characters, 2 numbers, 1 uppercase, 1 lowercase, and 1 special character'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Teaching experience is required'],
    trim: true
  },
  bio: String,
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  schedule: [{
    date: Date,
    title: String,
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }
  }],
  profileImage: String,
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    activeCourses: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
TeacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
TeacherSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

TeacherSchema.methods.isResetTokenValid = function(token) {
  return this.resetPasswordToken === token && 
         this.resetPasswordExpires > Date.now();
};

// Remove sensitive fields when converting to JSON
TeacherSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationTokenExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  }
});

mongoose.models = {};

const Teacher = mongoose.model('Teacher', TeacherSchema);
export default Teacher;
