// models/Student.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const StudentSchema = new mongoose.Schema({
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
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [4, 'Username must be at least 4 characters']
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
        // Two numbers, one uppercase, one lowercase, one special character
        return /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*(),.?{}]).{10,}$/.test(v);
      },
      message: 'Password must have 10+ characters, 2 numbers, 1 uppercase, 1 lowercase, and 1 special character'
    }
  },
  preferredContactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profile: {
    avatar: String,
    bio: String,
    location: String,
    website: String,
    education: [{
      school: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      current: Boolean
    }],
    skills: [String],
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" }
    }
    
  }
}, {
  timestamps: true
});

// Hash password before saving
StudentSchema.pre('save', async function(next) {
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
StudentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

StudentSchema.methods.isResetTokenValid = function(token) {
  return this.resetPasswordToken === token && 
         this.resetPasswordExpires > Date.now();
};

// Ensure this model hasn't been compiled before
mongoose.models = {};

const Student = mongoose.model('Student', StudentSchema);
export default Student;
