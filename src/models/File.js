const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['file', 'folder'],
    required: true,
  },
  size: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: null,
  },
  s3Key: {
    type: String,
    default: null,
  },
  s3Url: {
    type: String,
    default: null,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
fileSchema.index({ userId: 1, parentId: 1 });
fileSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model('File', fileSchema);
