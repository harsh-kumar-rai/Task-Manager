const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Category = require('../models/Category');
const User = require('../models/User');

const sendValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

exports.listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort('-updatedAt')
      .lean();

    const ids = projects.map((p) => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const countsByProject = {};
    taskCounts.forEach((t) => {
      const pid = t._id.project.toString();
      if (!countsByProject[pid]) countsByProject[pid] = { total: 0, completed: 0 };
      countsByProject[pid].total += t.count;
      if (t._id.status === 'completed') countsByProject[pid].completed += t.count;
    });

    const enriched = projects.map((p) => {
      const member = p.members.find((m) => m.user._id.toString() === req.user._id.toString());
      return {
        ...p,
        myRole: member?.role || 'member',
        taskStats: countsByProject[p._id.toString()] || { total: 0, completed: 0 },
      };
    });

    res.json({ success: true, projects: enriched });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    if (sendValidation(req, res)) return;

    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    const populated = await project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members.user', select: 'name email' },
    ]);

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean();

    res.json({
      success: true,
      project: { ...project, myRole: req.projectRole },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    if (sendValidation(req, res)) return;

    const { name, description } = req.body;
    if (name !== undefined) req.project.name = name;
    if (description !== undefined) req.project.description = description;
    await req.project.save();

    const populated = await req.project.populate([
      { path: 'owner', select: 'name email' },
      { path: 'members.user', select: 'name email' },
    ]);

    res.json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    if (req.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete it' });
    }

    await Promise.all([
      Task.deleteMany({ project: req.project._id }),
      Category.deleteMany({ project: req.project._id }),
      req.project.deleteOne(),
    ]);

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    if (sendValidation(req, res)) return;

    const { email, role } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    if (req.project.isMember(user._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    req.project.members.push({ user: user._id, role: role === 'admin' ? 'admin' : 'member' });
    await req.project.save();

    const populated = await req.project.populate('members.user', 'name email');

    res.status(201).json({ success: true, members: populated.members });
  } catch (err) {
    next(err);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const member = req.project.getMember(req.params.userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (req.project.owner.toString() === req.params.userId && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Owner must remain admin' });
    }

    member.role = role;
    await req.project.save();

    const populated = await req.project.populate('members.user', 'name email');
    res.json({ success: true, members: populated.members });
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    if (req.project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
    }

    const memberExists = req.project.isMember(req.params.userId);
    if (!memberExists) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    req.project.members = req.project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await req.project.save();

    await Task.updateMany(
      { project: req.project._id, assignedTo: req.params.userId },
      { $set: { assignedTo: null } }
    );

    const populated = await req.project.populate('members.user', 'name email');
    res.json({ success: true, members: populated.members });
  } catch (err) {
    next(err);
  }
};
