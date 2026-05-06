import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import { initialsFor, avatarColorClass } from '../lib/format';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { projects } = useProjects();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard');
        setStats(data.dashboard.stats);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const completed = stats?.completed || 0;
  const total = stats?.totalAssigned || 0;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </header>

      <div className="profile-card">
        <div className="profile-head">
          <span className={`avatar avatar-lg ${avatarColorClass(user?.email)}`}>
            {initialsFor(user?.name)}
          </span>
          <div>
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat-cell">
            <div className="label">Tasks assigned</div>
            <div className="value">{total}</div>
          </div>
          <div className="profile-stat-cell">
            <div className="label">Completed</div>
            <div className="value">{completed}</div>
          </div>
          <div className="profile-stat-cell">
            <div className="label">Completion rate</div>
            <div className="value">{rate}%</div>
          </div>
          <div className="profile-stat-cell">
            <div className="label">Projects</div>
            <div className="value">{projects.length}</div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn btn-secondary btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
