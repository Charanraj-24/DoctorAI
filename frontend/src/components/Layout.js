import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, MessageSquare, History, Heart, Users, 
  User, LogOut, Menu, X, Stethoscope
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/chat', icon: MessageSquare, label: 'AI Doctor' },
  { to: '/checkin', icon: Heart, label: 'Check In' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/partner', icon: Users, label: 'Partner' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/auth'); };

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="logo-icon"><Stethoscope size={20} /></div>
        <div>
          <div className="logo-name">AskMyDoc</div>
          <div className="logo-sub">Your 24/7 health companion</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-code">#{user?.shareCode}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </>
  );

  return (
    <div className="layout">
      {/* Desktop sidebar */}
      <aside className="sidebar desktop">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <aside className="sidebar mobile" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="main-content">
        <div className="mobile-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="mobile-logo"><Stethoscope size={18} /> MediAI</div>
        </div>
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        .layout { display: flex; height: 100vh; overflow: hidden; }
        
        .sidebar {
          width: 260px;
          min-width: 260px;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          height: 100vh;
        }
        
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px;
          margin-bottom: 32px;
        }
        
        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .logo-name {
          font-family: 'DM Serif Display', serif;
          font-size: 18px;
          color: var(--text);
        }
        
        .logo-sub {
          font-size: 11px;
          color: var(--text3);
        }
        
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: var(--text2);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .nav-item:hover { background: var(--surface); color: var(--text); }
        .nav-item.active { background: var(--surface); color: var(--accent); }
        .nav-item.active svg { color: var(--accent); }
        
        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: var(--surface);
          border-radius: var(--radius-sm);
          margin-top: 16px;
        }
        
        .user-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }
        
        .user-name { font-size: 13px; font-weight: 500; color: var(--text); }
        .user-code { font-size: 11px; color: var(--text3); font-family: monospace; }
        
        .logout-btn {
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .logout-btn:hover { color: var(--danger); }
        
        .main-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .page-wrapper { flex: 1; padding: 32px; max-width: 1200px; }
        
        .mobile-header {
          display: none;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 10;
        }
        
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Serif Display', serif;
          font-size: 16px;
        }
        
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 100;
        }
        
        .sidebar.desktop { display: flex; }
        .sidebar.mobile { display: flex; }
        
        @media (max-width: 768px) {
          .sidebar.desktop { display: none; }
          .mobile-header { display: flex; }
          .mobile-overlay { display: block; }
          .sidebar.mobile { position: fixed; left: 0; top: 0; height: 100vh; z-index: 101; }
          .page-wrapper { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
