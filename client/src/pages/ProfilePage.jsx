import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { stats, fetchStats } = useTasks();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-name">{user?.name}</div>
        <div className="profile-email">{user?.email}</div>

        <div className="profile-stat">
          <span className="label">Total Tasks</span>
          <span className="val">{stats?.total || 0}</span>
        </div>
        <div className="profile-stat">
          <span className="label">Completed</span>
          <span className="val">{stats?.completed || 0}</span>
        </div>
        <div className="profile-stat">
          <span className="label">In Progress</span>
          <span className="val">{stats?.inProgress || 0}</span>
        </div>
        <div className="profile-stat">
          <span className="label">Completion Rate</span>
          <span className="val">
            {stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </span>
        </div>
        <div className="profile-stat">
          <span className="label">Member Since</span>
          <span className="val">{memberSince}</span>
        </div>

        <button className="btn btn-danger" style={{ width: '100%', marginTop: '24px' }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
