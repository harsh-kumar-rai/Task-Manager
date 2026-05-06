const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const populateTask = (q) =>
  q
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('labels', 'name color')
    .populate('project', 'name');

const sendValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

const canModify = (task, userId, projectRole) => {
  if (projectRole === 'admin') return true;
  if (task.createdBy?._id?.toString() === userId.toString()) return true;
  if (task.assignedTo?._id?.toString() === userId.toString()) return true;
  return false;
};

exports.listProjectTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, search } = req.query;
    const query = { project: req.project._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo === 'me') query.assignedTo = req.user._id;
    else if (assignedTo === 'unassigned') query.assignedTo = null;
    else if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await populateTask(Task.find(query).sort('-createdAt'));
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    if (sendValidation(req, res)) return;

    const { title, description, status, priority, dueDate, assignedTo, labels } = req.body;

    if (assignedTo && !req.project.isMember(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      labels: labels || [],
      project: req.project._id,
      createdBy: req.user._id,
    });

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project._id);
    if (!project || !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project._id);
    if (!project || !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const role = project.getMember(req.user._id).role;
    if (!canModify(task, req.user._id, role)) {
      return res.status(403).json({ success: false, message: 'You cannot modify this task' });
    }

    const { title, description, status, priority, dueDate, assignedTo, labels } = req.body;

    if (assignedTo !== undefined && assignedTo !== null && !project.isMember(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Assignee must be a project member' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (labels !== undefined) task.labels = labels;

    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    res.json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isAdmin = project.isAdmin(req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only admins or the creator can delete this task' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task removed' });
  } catch (err) {
    next(err);
  }
};

exports.getMyTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { assignedTo: req.user._id };
    if (status) query.status = status;

    const tasks = await populateTask(Task.find(query).sort('dueDate createdAt'));
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};
