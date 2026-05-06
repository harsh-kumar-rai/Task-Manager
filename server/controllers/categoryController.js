const Category = require('../models/Category');

exports.listLabels = async (req, res, next) => {
  try {
    const labels = await Category.find({ project: req.project._id }).sort('name');
    res.json({ success: true, labels });
  } catch (err) {
    next(err);
  }
};

exports.createLabel = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const label = await Category.create({
      name,
      color: color || '#4F46E5',
      project: req.project._id,
    });
    res.status(201).json({ success: true, label });
  } catch (err) {
    next(err);
  }
};

exports.updateLabel = async (req, res, next) => {
  try {
    const label = await Category.findOneAndUpdate(
      { _id: req.params.labelId, project: req.project._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!label) return res.status(404).json({ success: false, message: 'Label not found' });
    res.json({ success: true, label });
  } catch (err) {
    next(err);
  }
};

exports.deleteLabel = async (req, res, next) => {
  try {
    const label = await Category.findOneAndDelete({
      _id: req.params.labelId,
      project: req.project._id,
    });
    if (!label) return res.status(404).json({ success: false, message: 'Label not found' });
    res.json({ success: true, message: 'Label removed' });
  } catch (err) {
    next(err);
  }
};
