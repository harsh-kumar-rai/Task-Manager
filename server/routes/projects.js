const router = require('express').Router();
const { body } = require('express-validator');
const protect = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAuth');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const labelController = require('../controllers/categoryController');

router.use(protect);

router.route('/')
  .get(projectController.listProjects)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
      body('description').optional().isLength({ max: 1000 }),
    ],
    projectController.createProject
  );

router.get('/:id', requireProjectMember, projectController.getProject);

router.put(
  '/:id',
  requireProjectAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
    body('description').optional().isLength({ max: 1000 }),
  ],
  projectController.updateProject
);

router.delete('/:id', requireProjectAdmin, projectController.deleteProject);

router.post(
  '/:id/members',
  requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  projectController.addMember
);

router.patch('/:id/members/:userId', requireProjectAdmin, projectController.updateMemberRole);
router.delete('/:id/members/:userId', requireProjectAdmin, projectController.removeMember);

router.get('/:projectId/tasks', requireProjectMember, taskController.listProjectTasks);
router.post(
  '/:projectId/tasks',
  requireProjectMember,
  [body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 })],
  taskController.createTask
);

router.get('/:projectId/labels', requireProjectMember, labelController.listLabels);
router.post(
  '/:projectId/labels',
  requireProjectAdmin,
  [body('name').trim().notEmpty().withMessage('Label name is required').isLength({ max: 40 })],
  labelController.createLabel
);
router.put('/:projectId/labels/:labelId', requireProjectAdmin, labelController.updateLabel);
router.delete('/:projectId/labels/:labelId', requireProjectAdmin, labelController.deleteLabel);

module.exports = router;
