import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineSearch } from 'react-icons/hi';
import api from '../services/api';
import { formatDate, isOverdue, statusLabel } from '../lib/format';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/tasks/me');
        if (!cancelled) setTasks(data.tasks);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'open' && t.status === 'completed') return false;
      if (filter === 'overdue' && !isOverdue(t.dueDate, t.status)) return false;
      if (filter === 'completed' && t.status !== 'completed') return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter, search]);

  const counts = useMemo(() => ({
    open: tasks.filter((t) => t.status !== 'completed').length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }), [tasks]);

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Across all projects</p>
          <h1>My tasks</h1>
          <p className="page-meta">Everything assigned to you, in one focused list.</p>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>
          Open <span className="tab-count">{counts.open}</span>
        </button>
        <button className={`tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>
          Overdue <span className="tab-count">{counts.overdue}</span>
        </button>
        <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
          Completed <span className="tab-count">{counts.completed}</span>
        </button>
      </nav>

      <div className="toolbar">
        <div className="search">
          <HiOutlineSearch />
          <input
            placeholder="Search your tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-pad">
          <div className="empty">
            <p className="empty-title">Nothing here</p>
            <p className="empty-desc">
              {filter === 'completed' ? 'Complete a task to see it here.' : 'No tasks match this filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="row-list">
            {filtered.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <Link
                  key={task._id}
                  to={`/projects/${task.project._id}`}
                  className="row"
                  style={{ color: 'inherit' }}
                >
                  <div className="row-main">
                    <div className="row-title">{task.title}</div>
                    <div className="row-sub flex items-center gap-2">
                      <span>{task.project.name}</span>
                      {task.priority !== 'medium' && (
                        <>
                          <span style={{ color: 'var(--border-strong)' }}>·</span>
                          <span className={`priority priority-${task.priority}`}>
                            <span className="priority-dot" />
                            {task.priority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {task.dueDate && (
                    <span
                      className="row-sub flex items-center gap-2"
                      style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: overdue ? 500 : 400 }}
                    >
                      <HiOutlineCalendar size={13} />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  <span className={`badge badge-${task.status}`}>
                    <span className="dot" />
                    {statusLabel(task.status)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
