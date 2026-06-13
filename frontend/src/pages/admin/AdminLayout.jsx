import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/restaurants', icon: '🏪', label: 'Restaurants' },
  { to: '/admin/orders', icon: '📦', label: 'Orders' },
  { to: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { to: '/admin/commissions', icon: '💰', label: 'Commissions' },
  { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>Quick<em style={{ color: '#FF6B35', fontStyle: 'normal' }}>Byte</em></span>
        </div>
        <div style={{ padding: '0 4px 16px', marginBottom: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(240,240,248,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Admin Panel</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.profile?.full_name || 'Admin'}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(240,240,248,0.4)' }}>📱 {user?.auth_id}</div>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>🚪 Logout</button>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
