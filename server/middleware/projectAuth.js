const mongoose = require('mongoose');
const Project = require('../models/Project');

const loadProject = async (projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return null;
  return Project.findById(projectId);
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await loadProject(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    req.project = project;
    req.projectRole = project.getMember(req.user._id).role;
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await loadProject(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.project = project;
    req.projectRole = 'admin';
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
