import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, ListTodo, Columns3, FolderKanban, Users, BarChart3,
  BrainCircuit, LogOut, Bell, Search, Zap
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Tasks', to: '/tasks', icon: ListTodo },
  { label: 'Kanban Board', to: '/kanban', icon: Columns3 },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Teams', to: '/teams', icon: Users },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'AI Insights', to: '/ai', icon: BrainCircuit },
];

export default function Layout() {
  const { user, logout, notifications, clearNotifications } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const pageTitle = navItems.find(n => location.pathname === n.to || location.pathname.startsWith(`${n.to}/`))?.label || 'Dashboard';

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('q') || '';
    setSearch(query);
  }, [location.search]);

  const handleSearch = () => {
    navigate(`/tasks${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const unreadCount = notifications.length;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#fff" />
          </div>
          <span>TeamAI</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Main Menu</div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout}>
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role || 'employee'}</div>
            </div>
            <LogOut size={16} style={{ color: '#94a3b8' }} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="search-box">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search tasks..."
              aria-label="Search tasks"
            />
            <button className="btn-ghost btn-icon" onClick={handleSearch}><Search size={18} /></button>
          </div>

          <div style={{ position: 'relative' }}>
            <button className="btn-ghost btn-icon" onClick={toggleNotifications} style={{ position: 'relative' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <span>Notifications</span>
                  <button className="btn-ghost" onClick={() => clearNotifications()}>Clear</button>
                </div>
                {notifications.length === 0 ? (
                  <div className="notification-empty">No notifications</div>
                ) : (
                  notifications.map((note) => (
                    <div key={note.id} className="notification-item">
                      <strong>{note.title}</strong>
                      <div>{note.message}</div>
                      <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
