import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiPlus, HiOutlinePencil, HiOutlineTrash, HiCheck, HiOutlineCalendar } from 'react-icons/hi';

export default function TasksPage() {
  const {
    tasks, categories, loading, pagination,
    fetchTasks, fetchCategories, createTask, updateTask, deleteTask, createCategory,
  } = useTasks();

  const [filters, setFilters] = useState({ search: '', status: '', priority: '', category: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', category: '', tags: '' });

  const loadTasks = useCallback(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.category) params.category = filters.category;
    fetchTasks(params);
  }, [filters, fetchTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', category: '', tags: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      category: task.category?._id || '',
      tags: (task.tags || []).join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        category: form.category || undefined,
        dueDate: form.dueDate || undefined,
      };

      if (editingTask) {
        await updateTask(editingTask._id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const toggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await updateTask(task._id, { status: nextStatus });
      loadTasks();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createCategory({ name: newCatName, color: newCatColor });
      toast.success('Category created');
      setNewCatName('');
      setShowCatModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCatModal(true)}>
            + Category
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <HiPlus /> New Task
          </button>
        </div>
      </div>

      <div className="task-filters">
        <div className="search-box">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <select className="filter-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="page-loader" style={{ minHeight: '200px' }}><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>No tasks found</h3>
          <p>Create your first task or adjust your filters</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task, i) => (
            <div key={task._id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
              <button className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`} onClick={() => toggleStatus(task)}>
                {task.status === 'completed' && <HiCheck />}
              </button>
              <div className="task-body" onClick={() => openEdit(task)}>
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-desc">{task.description}</div>}
                <div className="task-meta">
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                  {task.category && (
                    <span className="task-category-tag">
                      <span className="cat-dot" style={{ background: task.category.color }} />
                      {task.category.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                      <HiOutlineCalendar /> {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn-icon" onClick={() => openEdit(task)}><HiOutlinePencil /></button>
                <button className="btn-icon" onClick={() => handleDelete(task._id)}><HiOutlineTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add more details..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="filter-select" style={{ width: '100%' }} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="filter-select" style={{ width: '100%' }} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. frontend, bug, feature"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2>New Category</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{ width: '60px', height: '36px', padding: '2px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
