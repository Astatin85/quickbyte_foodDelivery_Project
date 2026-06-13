import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const rRes = await api.get('/restaurant/my');
        if (rRes.data.length > 0) {
          const r = rRes.data[0];
          setRestaurant(r);
          const [sRes, oRes] = await Promise.all([
            api.get(`/restaurant/${r.restaurant_id}/stats`),
            api.get(`/restaurant/${r.restaurant_id}/orders`),
          ]);
          setStats(sRes.data);
          setRecentOrders(oRes.data.slice(0, 5));
        }
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="spinner" />;
  if (!restaurant) return (
    <div>
      <div className="page-header"><h1 className="page-title">📊 Dashboard</h1></div>
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <h3>No restaurant registered yet</h3>
        <p>Go to <strong>Restaurant Profile</strong> to register your restaurant</p>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: '📦', color: '#3b82f6' },
    { label: 'Total Revenue', value: `₹${stats?.revenue || 0}`, icon: '💰', color: '#22c55e' },
    { label: 'Avg Rating', value: Number(stats?.avg_rating || 0).toFixed(1) + ' ⭐', icon: '⭐', color: '#f59e0b' },
    { label: 'Total Reviews', value: stats?.total_reviews || 0, icon: '💬', color: '#8b5cf6' },
  ];

  const statusBg = { PLACED: '#3b82f6', CONFIRMED: '#f59e0b', PREPARING: '#8b5cf6', READY_FOR_PICKUP: '#22c55e', DELIVERED: '#22c55e', CANCELLED: '#ef4444' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 {restaurant.name}</h1>
        <p className="page-subtitle">Restaurant Dashboard — {restaurant.city} • {restaurant.cuisine_type}</p>
      </div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20` }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Orders</h3>
        {recentOrders.length === 0 ? <div className="empty-state"><div className="empty-icon">📦</div><h3>No orders yet</h3></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Order ID','Customer','Amount','Status','Date'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>)}</tr></thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.order_id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>#{o.order_id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{o.customer_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>₹{o.total_amount}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: `${statusBg[o.status] || '#666'}20`, color: statusBg[o.status] || '#666', padding: '4px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>{o.status}</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
