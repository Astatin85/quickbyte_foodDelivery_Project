import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api/config';
import toast from 'react-hot-toast';

const statusColor = { PLACED:'#3b82f6', CONFIRMED:'#f59e0b', PREPARING:'#8b5cf6', READY_FOR_PICKUP:'#22c55e', OUT_FOR_DELIVERY:'#FF6B35', DELIVERED:'#22c55e', CANCELLED:'#ef4444' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard-stats').then(res => setStats(res.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const statCards = [
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: '📦', color: '#3b82f6', link: '/admin/orders' },
    { label: 'Total Revenue', value: `₹${stats?.total_revenue || 0}`, icon: '💰', color: '#22c55e', link: '/admin/commissions' },
    { label: 'Customers', value: stats?.total_customers || 0, icon: '👥', color: '#8b5cf6', link: '/admin/users' },
    { label: 'Restaurants', value: stats?.total_restaurants || 0, icon: '🏪', color: '#f59e0b', link: '/admin/restaurants' },
    { label: 'Delivery Partners', value: stats?.total_partners || 0, icon: '🛵', color: '#06b6d4', link: '/admin/users' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and key metrics</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} className="stat-card" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={() => navigate(s.link)}>
            <div className="stat-icon" style={{ background: `${s.color}20` }}>{s.icon}</div>
            <div><div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </motion.div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700 }}>Recent Orders</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/orders')}>View All</button>
        </div>
        {stats?.recent_orders?.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📦</div><h3>No orders yet</h3></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['ID','Customer','Restaurant','Amount','Status','Date'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>)}</tr></thead>
            <tbody>
              {stats?.recent_orders?.map(o => (
                <tr key={o.order_id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>#{o.order_id}</td>
                  <td style={{ padding: '12px 16px' }}>{o.customer_name}</td>
                  <td style={{ padding: '12px 16px' }}>{o.restaurant_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>₹{o.total_amount}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: `${statusColor[o.status] || '#666'}20`, color: statusColor[o.status] || '#888', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>{o.status}</span></td>
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
