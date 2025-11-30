// models/CalendarEvent.js
import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: {
    type: String,
    enum: ['class', 'office-hours', 'other'],
    default: 'class'
  },
  location: String,
  attendees: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: {
      type: String,
      enum: ['attending', 'not-attending', 'tentative'],
      default: 'tentative'
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', calendarEventSchema);
