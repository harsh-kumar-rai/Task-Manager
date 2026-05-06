import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineClipboardCopy, HiOutlinePlus, HiOutlineSearch, HiOutlineTrash, HiOutlineDotsHorizontal } from 'react-icons/hi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import { initialsFor, avatarColorClass, statusLabel } from '../lib/format';

const STATUS_COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'in-progress', title: 'In progress' },
  { id: 'completed', title: 'Completed' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchProjects } = useProjects();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');

  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  const isAdmin = project?.myRole === 'admin';

  const loadProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load project');
      navigate('/projects');
    }
  }, [id, navigate]);

  const loadTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}/tasks`);
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const loadLabels = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}/labels`);
      setLabels(data.labels);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProject(), loadTasks(), loadLabels()]).finally(() => setLoading(false));
  }, [loadProject, loadTasks, loadLabels]);

  const handleCreateTask = async (payload) => {
    const { data } = await api.post(`/projects/${id}/tasks`, payload);
    setTasks((t) => [data.task, ...t]);
    setTaskModal({ open: false, task: null });
    toast.success('Task created');
    fetchProjects();
  };

  const handleUpdateTask = async (payload) => {
    const { data } = await api.put(`/tasks/${taskModal.task._id}`, payload);
    setTasks((t) => t.map((x) => (x._id === data.task._id ? data.task : x)));
    setTaskModal({ open: false, task: null });
    toast.success('Task updated');
    fetchProjects();
  };

  const handleDeleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskModal.task._id}`);
      setTasks((t) => t.filter((x) => x._id !== taskModal.task._id));
      setTaskModal({ open: false, task: null });
      toast.success('Task deleted');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const handleCopyProjectCode = async () => {
    try {
      await navigator.clipboard.writeText(project.joinCode);
      toast.success('Project code copied');
    } catch {
      toast.error('Could not copy code');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAssignee === 'me' && t.assignedTo?._id !== user.id) return false;
      if (filterAssignee === 'unassigned' && t.assignedTo) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterAssignee, search, user.id]);

  const tasksByStatus = useMemo(() => {
    const groups = { todo: [], 'in-progress': [], completed: [] };
    filteredTasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const taskCanModify = (task) => {
    if (!task) return true;
    if (isAdmin) return true;
    if (task.createdBy?._id === user.id) return true;
    if (task.assignedTo?._id === user.id) return true;
    return false;
  };

  const taskCanDelete = (task) => {
    if (!task) return false;
    if (isAdmin) return true;
    if (task.createdBy?._id === user.id) return true;
    return false;
  };

  if (loading || !project) {
    return (
      <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const totalCount = tasks.length;

  return (
    <div className="fade-in">
      <header className="project-header">
        <p className="eyebrow">Project</p>
        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 36, letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>
            {project.description && (
              <p className="page-meta" style={{ marginTop: 6, maxWidth: 560 }}>{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.joinCode && (
              <span className="project-code-pill">
                Code <code>{project.joinCode}</code>
                <button
                  type="button"
                  className="btn-icon code-copy-btn"
                  onClick={handleCopyProjectCode}
                  aria-label={`Copy project code ${project.joinCode}`}
                  title="Copy code"
                >
                  <HiOutlineClipboardCopy size={14} />
                </button>
              </span>
            )}
            <span className={`role-pill role-${project.myRole}`}>{project.myRole}</span>
            <button className="btn btn-primary" onClick={() => setTaskModal({ open: true, task: null })}>
              <HiOutlinePlus size={14} /> New task
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          Tasks <span className="tab-count">{totalCount}</span>
        </button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Members <span className="tab-count">{project.members.length}</span>
        </button>
        <button className={`tab ${tab === 'labels' ? 'active' : ''}`} onClick={() => setTab('labels')}>
          Labels <span className="tab-count">{labels.length}</span>
        </button>
      </nav>

      {tab === 'tasks' && (
        <>
          <div className="toolbar">
            <div className="search">
              <HiOutlineSearch />
              <input
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{ width: 'auto', minWidth: 160 }}
            >
              <option value="all">All assignees</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="board">
            {STATUS_COLUMNS.map((col) => (
              <div key={col.id} className="board-column">
                <div className="board-column-head">
                  <div className="board-column-title">
                    <span className={`badge badge-${col.id}`}><span className="dot" /></span>
                    {col.title}
                  </div>
                  <span className="board-column-count">{tasksByStatus[col.id].length}</span>
                </div>
                <div className="board-column-list">
                  {tasksByStatus[col.id].length === 0 ? (
                    <div className="board-empty">No tasks</div>
                  ) : (
                    tasksByStatus[col.id].map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onClick={() => setTaskModal({ open: true, task })}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'members' && (
        <MembersTab
          project={project}
          isAdmin={isAdmin}
          currentUserId={user.id}
          onChange={(updatedMembers) => setProject((p) => ({ ...p, members: updatedMembers }))}
          onOpenInvite={() => setInviteOpen(true)}
        />
      )}

      {tab === 'labels' && (
        <LabelsTab
          projectId={id}
          isAdmin={isAdmin}
          labels={labels}
          onChange={setLabels}
          onOpenCreate={() => setLabelOpen(true)}
        />
      )}

      <TaskFormModal
        open={taskModal.open}
        task={taskModal.task}
        onClose={() => setTaskModal({ open: false, task: null })}
        onSubmit={taskModal.task ? handleUpdateTask : handleCreateTask}
        onDelete={handleDeleteTask}
        members={project.members}
        labels={labels}
        canModify={taskCanModify(taskModal.task)}
        canDelete={taskCanDelete(taskModal.task)}
      />

      {inviteOpen && (
        <InviteModal
          projectId={id}
          onClose={() => setInviteOpen(false)}
          onAdded={(updatedMembers) => {
            setProject((p) => ({ ...p, members: updatedMembers }));
            setInviteOpen(false);
            fetchProjects();
          }}
        />
      )}

      {labelOpen && (
        <LabelModal
          projectId={id}
          onClose={() => setLabelOpen(false)}
          onCreated={(label) => {
            setLabels((l) => [...l, label].sort((a, b) => a.name.localeCompare(b.name)));
            setLabelOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MembersTab({ project, isAdmin, currentUserId, onChange, onOpenInvite }) {
  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await api.patch(`/projects/${project._id}/members/${userId}`, { role });
      onChange(data.members);
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update role');
    }
  };

  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      const { data } = await api.delete(`/projects/${project._id}/members/${userId}`);
      onChange(data.members);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove member');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted" style={{ fontSize: 13 }}>
          {project.members.length} {project.members.length === 1 ? 'person has' : 'people have'} access to this project.
        </p>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={onOpenInvite}>
            <HiOutlinePlus size={13} /> Invite member
          </button>
        )}
      </div>

      <div className="card">
        <table className="members-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Member</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {project.members.map((m) => {
              const isOwner = m.user._id === project.owner._id;
              const isYou = m.user._id === currentUserId;
              return (
                <tr key={m.user._id}>
                  <td>
                    <div className="member-cell">
                      <span className={`avatar ${avatarColorClass(m.user.email)}`}>
                        {initialsFor(m.user.name)}
                      </span>
                      <div>
                        <div className="name">
                          {m.user.name}
                          {isYou && <span className="text-muted" style={{ fontWeight: 400, marginLeft: 6 }}>(you)</span>}
                          {isOwner && <span className="text-muted" style={{ fontWeight: 400, marginLeft: 6 }}>· owner</span>}
                        </div>
                        <div className="email">{m.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isAdmin && !isOwner ? (
                      <select
                        className="select"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                        style={{ width: 'auto', minWidth: 120 }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className={`role-pill role-${m.role}`}>{m.role}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isAdmin && !isOwner && !isYou && (
                      <button
                        className="btn-icon"
                        onClick={() => handleRemove(m.user._id, m.user.name)}
                        title="Remove member"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LabelsTab({ projectId, isAdmin, labels, onChange, onOpenCreate }) {
  const handleDelete = async (label) => {
    if (!confirm(`Delete label "${label.name}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/labels/${label._id}`);
      onChange(labels.filter((l) => l._id !== label._id));
      toast.success('Label removed');
    } catch (err) {
      toast.error('Could not delete label');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted" style={{ fontSize: 13 }}>
          Labels help categorize tasks across this project.
        </p>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={onOpenCreate}>
            <HiOutlinePlus size={13} /> New label
          </button>
        )}
      </div>

      <div className="card">
        {labels.length === 0 ? (
          <div className="empty" style={{ padding: '40px 20px' }}>
            <p className="empty-title">No labels yet</p>
            <p className="empty-desc">{isAdmin ? 'Create your first label to start tagging tasks.' : 'Admins can create labels for this project.'}</p>
          </div>
        ) : (
          <div className="row-list">
            {labels.map((l) => (
              <div key={l._id} className="row">
                <span className="label-dot" style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                <div className="row-main">
                  <div className="row-title">{l.name}</div>
                </div>
                {isAdmin && (
                  <button className="btn-icon" onClick={() => handleDelete(l)} title="Delete">
                    <HiOutlineTrash size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function InviteModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email: email.trim(), role });
      toast.success('Member added');
      onAdded(data.members);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h2>Invite a member</h2>
          <p>The user must already have a Stack account. Enter their email to add them.</p>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member — can view and work on tasks</option>
              <option value="admin">Admin — full project access</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !email.trim()}>
            {submitting ? 'Adding…' : 'Add to project'}
          </button>
        </div>
      </form>
    </div>
  );
}

function LabelModal({ projectId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/labels`, { name: name.trim(), color });
      toast.success('Label created');
      onCreated(data.label);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create label');
    } finally {
      setSubmitting(false);
    }
  };

  const presets = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#0891B2', '#7C3AED', '#475569'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h2>New label</h2>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bug, Feature, Design"
              required
              autoFocus
              maxLength={40}
            />
          </div>
          <div className="field">
            <label>Color</label>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {presets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: c,
                    border: color === c ? '2px solid var(--text)' : '2px solid transparent',
                    boxShadow: color === c ? '0 0 0 2px var(--bg)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
            {submitting ? 'Creating…' : 'Create label'}
          </button>
        </div>
      </form>
    </div>
  );
}
