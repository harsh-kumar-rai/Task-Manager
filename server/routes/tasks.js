const router = require('express').Router();
const { body } = require('express-validator');
const protect = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
} = require('../controllers/taskController');

router.use(protect);

router.get('/stats', getStats);

router.route('/')
  .get(getTasks)
  .post(
    [body('title').trim().notEmpty().withMessage('Task title is required')],
    createTask
  );

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
