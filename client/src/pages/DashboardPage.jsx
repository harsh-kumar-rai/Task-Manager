import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineCalendar } from 'react-icons/hi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { greeting, todayLong, formatDate, isOverdue, statusLabel, avatarColorClass } from '../lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        if (!cancelled) setData(res.dashboard);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const stats = data?.stats || { totalAssigned: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0, totalProjects: 0 };
  const upcoming = data?.upcomingTasks || [];
  const projects = data?.recentProjects || [];

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">{todayLong()}</p>
          <h1>{greeting()}, <em>{user?.name?.split(' ')[0]}</em></h1>
          <p className="page-meta">Here&apos;s what&apos;s on your plate across {stats.totalProjects} {stats.totalProjects === 1 ? 'project' : 'projects'}.</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Assigned to me</span>
          <span className="stat-value">{stats.totalAssigned}</span>
          <span className="stat-trend">{stats.todo} to do · {stats.inProgress} in progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Overdue</span>
          <span className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--danger)' : 'inherit' }}>
            {stats.overdue}
          </span>
          <span className="stat-trend">Past due date and not completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-trend">All time</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Projects</span>
          <span className="stat-value">{stats.totalProjects}</span>
          <span className="stat-trend">Active workspaces</span>
        </div>
      </div>

      <div className="two-col">
        <section className="section">
          <div className="section-head">
            <h2>Upcoming for you</h2>
            <Link to="/my-tasks" className="section-link">
              View all <HiOutlineArrowRight style={{ display: 'inline', verticalAlign: -2 }} />
            </Link>
          </div>
          <div className="card">
            {upcoming.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <p className="empty-title">Nothing on your plate</p>
                <p className="empty-desc">You&apos;re all caught up. Tasks assigned to you will appear here.</p>
              </div>
            ) : (
              <div className="row-list">
                {upcoming.map((task) => {
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
                        <div className="row-sub">
                          {task.project.name}
                        </div>
                      </div>
                      {task.dueDate && (
                        <span
                          className="row-sub flex items-center gap-2"
                          style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}
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
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Recent projects</h2>
            <Link to="/projects" className="section-link">
              All projects <HiOutlineArrowRight style={{ display: 'inline', verticalAlign: -2 }} />
            </Link>
          </div>
          <div className="card">
            {projects.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px' }}>
                <p className="empty-title">No projects yet</p>
                <p className="empty-desc">Create your first project to start organizing work.</p>
              </div>
            ) : (
              <div className="row-list">
                {projects.map((p) => (
                  <Link key={p._id} to={`/projects/${p._id}`} className="row" style={{ color: 'inherit' }}>
                    <span
                      className={`avatar avatar-sm ${avatarColorClass(p._id)}`}
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </span>
                    <div className="row-main">
                      <div className="row-title">{p.name}</div>
                      <div className="row-sub">{p.members.length} {p.members.length === 1 ? 'member' : 'members'}</div>
                    </div>
                    <HiOutlineArrowRight color="var(--text-muted)" size={14} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
