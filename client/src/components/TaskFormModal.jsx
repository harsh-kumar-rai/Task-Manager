import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const emptyForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assignedTo: '',
  labels: [],
};

export default function TaskFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  task,
  members = [],
  labels = [],
  canModify = true,
  canDelete = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        assignedTo: task.assignedTo?._id || '',
        labels: (task.labels || []).map((l) => l._id),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, task]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLabel = (id) => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(id) ? f.labels.filter((x) => x !== id) : [...f.labels, id],
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h2>{task ? 'Edit task' : 'New task'}</h2>
          {!canModify && (
            <p>You can only edit tasks you created or are assigned to.</p>
          )}
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="What needs to be done?"
              required
              autoFocus
              disabled={!canModify}
              maxLength={200}
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Add a few more details (optional)"
              disabled={!canModify}
              maxLength={2000}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                disabled={!canModify}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select
                className="select"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                disabled={!canModify}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Due date</label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                disabled={!canModify}
              />
            </div>
            <div className="field">
              <label>Assignee</label>
              <select
                className="select"
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                disabled={!canModify}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {labels.length > 0 && (
            <div className="field">
              <label>Labels</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {labels.map((label) => {
                  const active = form.labels.includes(label._id);
                  return (
                    <button
                      key={label._id}
                      type="button"
                      onClick={() => canModify && toggleLabel(label._id)}
                      className="label-chip"
                      style={{
                        cursor: canModify ? 'pointer' : 'not-allowed',
                        background: active ? 'var(--surface)' : 'var(--surface-muted)',
                        borderColor: active ? label.color : 'var(--border)',
                        color: active ? 'var(--text)' : 'var(--text-secondary)',
                      }}
                    >
                      <span className="label-dot" style={{ background: label.color }} />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {task && canDelete && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginRight: 'auto', color: 'var(--danger)' }}
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          {canModify && (
            <button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim()}>
              {submitting ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
