const router = require('express').Router();
const protect = require('../middleware/auth');
const { getMyTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.get('/me', getMyTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
