import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineFolder,
  HiOutlineClipboardCheck,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlinePlus,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectsContext';
import { initialsFor, avatarColorClass } from '../../lib/format';
import NewProjectModal from '../NewProjectModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const { projects, createProject } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleCreateProject = async (payload) => {
    const project = await createProject(payload);
    setNewProjectOpen(false);
    navigate(`/projects/${project._id}`);
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: HiOutlineHome, end: true },
    { to: '/projects', label: 'Projects', icon: HiOutlineFolder },
    { to: '/my-tasks', label: 'My tasks', icon: HiOutlineClipboardCheck },
    { to: '/profile', label: 'Profile', icon: HiOutlineUser },
  ];

  const initials = initialsFor(user?.name);

  return (
    <div className="app-shell">
      <div className="mobile-bar">
        <div className="brand-row">
          <span className="brand-mark" style={{ width: 22, height: 22, fontSize: 15 }}>S</span>
          Stack
        </div>
        <button className="btn-icon" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <HiOutlineMenu size={18} />
        </button>
      </div>

      {drawerOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">S</span>
          <h1>Stack</h1>
          <button
            className="btn-icon"
            onClick={() => setDrawerOpen(false)}
            style={{ marginLeft: 'auto', display: drawerOpen ? 'inline-flex' : 'none' }}
            aria-label="Close menu"
          >
            <HiOutlineX size={16} />
          </button>
        </div>

        <nav className="sidebar-nav" style={{ padding: '0 8px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-projects">
          <div className="sidebar-projects-header">
            <span>Projects</span>
            <button onClick={() => setNewProjectOpen(true)} aria-label="New project">
              <HiOutlinePlus size={12} />
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="sidebar-project-empty">No projects yet</div>
          ) : (
            <div className="sidebar-nav">
              {projects.slice(0, 12).map((p) => (
                <NavLink
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={{ paddingLeft: 10 }}
                >
                  <span
                    className={`avatar avatar-sm ${avatarColorClass(p._id)}`}
                    style={{ width: 16, height: 16, fontSize: 10, fontFamily: 'var(--font-serif)' }}
                  >
                    {p.name[0]?.toUpperCase()}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  {p.taskStats?.total > 0 && (
                    <span className="nav-link-count">{p.taskStats.total}</span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="user-chip" onClick={() => navigate('/profile')}>
            <span className={`avatar ${avatarColorClass(user?.email)}`}>{initials}</span>
            <div className="user-chip-meta">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </button>
          <button
            className="nav-link"
            style={{ width: '100%', marginTop: 4 }}
            onClick={logout}
          >
            <HiOutlineLogout />
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      {newProjectOpen && (
        <NewProjectModal
          onClose={() => setNewProjectOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
