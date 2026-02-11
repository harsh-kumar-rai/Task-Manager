import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineUser, HiOutlineLogout, HiMenu, HiX } from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
    { path: '/tasks', label: 'Tasks', icon: HiOutlineClipboardList },
    { path: '/profile', label: 'Profile', icon: HiOutlineUser },
  ];

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <HiX /> : <HiMenu />}
      </button>

      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">T</div>
          <h2>TaskFlow</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-link" onClick={logout} style={{ width: '100%', marginTop: '8px' }}>
            <HiOutlineLogout className="nav-icon" />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
