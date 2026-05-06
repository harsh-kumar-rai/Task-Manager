const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });

projectSchema.methods.getMember = function (userId) {
  return this.members.find((m) => m.user.toString() === userId.toString());
};

projectSchema.methods.isMember = function (userId) {
  return Boolean(this.getMember(userId));
};

projectSchema.methods.isAdmin = function (userId) {
  const member = this.getMember(userId);
  return member?.role === 'admin';
};

module.exports = mongoose.model('Project', projectSchema);
