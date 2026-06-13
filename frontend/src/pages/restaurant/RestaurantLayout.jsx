import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/config';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/restaurant/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/restaurant/profile', icon: '🏪', label: 'Restaurant Profile' },
  { to: '/restaurant/menu', icon: '🍽️', label: 'Manage Menu' },
  { to: '/restaurant/orders', icon: '📦', label: 'Orders' },
  { to: '/restaurant/owner-profile', icon: '👤', label: 'My Account' },
];

export default function RestaurantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Load restaurant to get is_open status
  useEffect(() => {
    api.get('/restaurant/my').then(res => {
      if (res.data?.length) setRestaurant(res.data[0]);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  const toggleOpen = async () => {
    if (!restaurant) return;
    setToggling(true);
    try {
      const newVal = !restaurant.is_open;
      await api.put(`/restaurant/${restaurant.restaurant_id}/toggle-open`, { is_open: newVal });
      setRestaurant(r => ({ ...r, is_open: newVal }));
      toast.success(newVal ? '🟢 Restaurant is now Online!' : '🔴 Restaurant is now Offline');
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(false); }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.5rem' }}>🍔</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>Quick<em style={{ color: '#FF6B35', fontStyle: 'normal' }}>Byte</em></span>
        </div>
        <div style={{ padding: '0 4px 16px', marginBottom: 8 }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(240,240,248,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Restaurant Owner</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.profile?.full_name || user?.auth_id}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(240,240,248,0.4)' }}>📱 {user?.auth_id}</div>
        </div>

        {/* Online/Offline toggle */}
        {restaurant && (
          <div style={{ padding: '10px 4px', marginBottom: 8 }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(240,240,248,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Restaurant Status</div>
            <button
              onClick={toggleOpen}
              disabled={toggling}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: restaurant.is_open ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                color: restaurant.is_open ? '#22c55e' : '#ef4444',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              {toggling ? '...' : restaurant.is_open ? '🟢 Online — Click to go Offline' : '🔴 Offline — Click to go Online'}
            </button>
          </div>
        )}

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
