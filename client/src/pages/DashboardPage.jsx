import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamation } from 'react-icons/hi';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, tasks, fetchStats, fetchTasks } = useTasks();

  useEffect(() => {
    fetchStats();
    fetchTasks({ limit: 5, sortBy: 'createdAt', order: 'desc' });
  }, [fetchStats, fetchTasks]);

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const circumference = 2 * Math.PI * 50;
  const dashOffset = circumference - (completionRate / 100) * circumference;

  const greetingHour = new Date().getHours();
  let greeting = 'Good morning';
  if (greetingHour >= 12 && greetingHour < 17) greeting = 'Good afternoon';
  else if (greetingHour >= 17) greeting = 'Good evening';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]}</h1>
          <p className="date-text">{today}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><HiOutlineClipboardList /></div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><HiOutlineClock /></div>
          <div className="stat-value">{stats?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><HiOutlineCheckCircle /></div>
          <div className="stat-value">{stats?.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><HiOutlineExclamation /></div>
          <div className="stat-value">{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="progress-ring-container">
          <div className="progress-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle className="ring-bg" cx="60" cy="60" r="50" />
              <circle
                className="ring-fill"
                cx="60" cy="60" r="50"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="progress-center">
              <span className="pct">{completionRate}%</span>
              <span className="pct-label">Done</span>
            </div>
          </div>
          <div className="progress-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--sky)' }} />
              <span>To Do</span>
              <span className="legend-count">{stats.todo}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--amber)' }} />
              <span>In Progress</span>
              <span className="legend-count">{stats.inProgress}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--emerald)' }} />
              <span>Completed</span>
              <span className="legend-count">{stats.completed}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--rose)' }} />
              <span>Overdue</span>
              <span className="legend-count">{stats.overdue}</span>
            </div>
          </div>
        </div>
      )}

      <div className="recent-tasks">
        <h3 className="section-title">Recent Tasks</h3>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Head over to the Tasks page to create your first task</p>
          </div>
        ) : (
          tasks.slice(0, 5).map((task) => (
            <div className="task-item" key={task._id}>
              <div>
                <div className="task-item-title">{task.title}</div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                {task.dueDate && <span className="task-due">{formatDate(task.dueDate)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
