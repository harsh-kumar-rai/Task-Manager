const Task = require('../models/Task');
const { validationResult } = require('express-validator');

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, category, search, sortBy, order, page, limit } = req.query;

    const query = { user: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const sortField = sortBy || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('category', 'name color icon')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pageSize),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      tasks,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).populate('category', 'name color icon');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    req.body.user = req.user._id;
    const task = await Task.create(req.body);
    const populated = await task.populate('category', 'name color icon');

    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name color icon');

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task removed' });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [statusCounts, priorityCounts, totalTasks, overdueTasks] = await Promise.all([
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ user: userId }),
      Task.countDocuments({
        user: userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date(), $ne: null },
      }),
    ]);

    const statusMap = {};
    statusCounts.forEach((s) => (statusMap[s._id] = s.count));

    const priorityMap = {};
    priorityCounts.forEach((p) => (priorityMap[p._id] = p.count));

    res.json({
      success: true,
      stats: {
        total: totalTasks,
        todo: statusMap['todo'] || 0,
        inProgress: statusMap['in-progress'] || 0,
        completed: statusMap['completed'] || 0,
        overdue: overdueTasks,
        byPriority: priorityMap,
      },
    });
  } catch (err) {
    next(err);
  }
};
