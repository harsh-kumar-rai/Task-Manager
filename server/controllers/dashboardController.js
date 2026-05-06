const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const projects = await Project.find({ 'members.user': userId })
      .select('_id name updatedAt members owner')
      .sort('-updatedAt')
      .limit(6)
      .lean();

    const projectIds = projects.map((p) => p._id);

    const [statusAgg, overdueCount, totalAssigned, upcomingTasks, recentlyCompleted] = await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        assignedTo: userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: now, $ne: null },
      }),
      Task.countDocuments({ assignedTo: userId }),
      Task.find({
        assignedTo: userId,
        status: { $ne: 'completed' },
      })
        .sort('dueDate createdAt')
        .limit(8)
        .populate('project', 'name')
        .populate('labels', 'name color')
        .lean(),
      Task.find({ assignedTo: userId, status: 'completed' })
        .sort('-updatedAt')
        .limit(4)
        .populate('project', 'name')
        .lean(),
    ]);

    const statusMap = { todo: 0, 'in-progress': 0, completed: 0 };
    statusAgg.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalAssigned,
          todo: statusMap.todo,
          inProgress: statusMap['in-progress'],
          completed: statusMap.completed,
          overdue: overdueCount,
          totalProjects: await Project.countDocuments({ 'members.user': userId }),
        },
        upcomingTasks,
        recentlyCompleted,
        recentProjects: projects,
      },
    });
  } catch (err) {
    next(err);
  }
};
