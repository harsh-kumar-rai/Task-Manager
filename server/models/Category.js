const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
      maxlength: 40,
    },
    color: {
      type: String,
      default: '#4F46E5',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
