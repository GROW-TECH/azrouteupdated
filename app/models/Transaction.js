const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Check if the model exists before defining it
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new Schema({
  // Core transaction details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'GBP'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Relationship references
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'wallet']
  },
  paymentDetails: {
    cardLast4: String,
    bankName: String,
    transferId: String
  },
  
  // Additional metadata
  description: String,
  metadata: {
    type: Map,
    of: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
}));

// Add indexes if they don't exist
if (!Transaction.schema.indexes().length) {
  Transaction.schema.index({ studentId: 1, createdAt: -1 });
  Transaction.schema.index({ teacherId: 1, createdAt: -1 });
  Transaction.schema.index({ courseId: 1 });
  Transaction.schema.index({ status: 1 });
}

// Instance methods - only add if they don't exist
if (!Transaction.prototype.markAsCompleted) {
  Transaction.prototype.markAsCompleted = async function() {
    this.status = 'completed';
    this.updatedAt = new Date();
    return this.save();
  };
}

if (!Transaction.prototype.refund) {
  Transaction.prototype.refund = async function() {
    this.status = 'refunded';
    this.updatedAt = new Date();
    return this.save();
  };
}

// Static methods - only add if they don't exist
if (!Transaction.findByTeacher) {
  Transaction.findByTeacher = function(teacherId) {
    return this.find({ teacherId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .populate('courseId', 'title price');
  };
}

if (!Transaction.findByStudent) {
  Transaction.findByStudent = function(studentId) {
    return this.find({ studentId })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name email')
      .populate('courseId', 'title price');
  };
}

if (!Transaction.getTeacherRevenue) {
  Transaction.getTeacherRevenue = async function(teacherId, startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          teacherId: mongoose.Types.ObjectId(teacherId),
          status: 'completed',
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: '$currency',
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
  };
}

module.exports = Transaction;
