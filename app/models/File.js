// models/File.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  _id: String,
  originalName: String,
  filename: String,
  type: String,
  size: Number,
  url: String,
  processedUrls: {
    '720p': String,
    '480p': String,
    '360p': String
  },
  playlistUrl: String,
processedUrl: String,
processingError: String,
  storageLocation: String,
  uploadedAt: { type: Date, default: Date.now },
  fileType: { type: String, enum: ['image', 'video'] },
  duration: { type: Number, default: 0 }, // For videos
  processedStatus: { type: String, default: 'pending' }, // For videos
  thumbnailUrl: { type: String, default: null } // For videos
}, {
  timestamps: true
});

export default mongoose.models.File || mongoose.model('File', fileSchema);
