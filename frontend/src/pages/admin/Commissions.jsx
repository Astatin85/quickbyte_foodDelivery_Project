import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function AdminCommissions() {
  const [data, setData] = useState({ commissions: [], summary: {} });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/commissions').then(res => setData(res.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);
  const { commissions, summary } = data;
  return (
    <div>
      <div className="page-header"><h1 className="page-title">💰 Commission & Profit</h1><p className="page-subtitle">Platform revenue tracking</p></div>
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Delivery Commissions', value: `₹${Number(summary?.total_delivery || 0).toFixed(0)}`, icon: '🛵', color: '#3b82f6' },
          { label: 'Restaurant Commissions', value: `₹${Number(summary?.total_restaurant || 0).toFixed(0)}`, icon: '🏪', color: '#f59e0b' },
          { label: 'Platform Profit', value: `₹${Number(summary?.total_profit || 0).toFixed(0)}`, icon: '💹', color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20` }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Order ID</th><th>Restaurant</th><th>Delivery Partner</th><th>Delivery Commission</th><th>Restaurant Commission</th><th>Platform Profit</th></tr></thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.commission_id}>
                  <td>#{c.order_id}</td>
                  <td>{c.restaurant_name || '—'}</td>
                  <td>{c.partner_name || '—'}</td>
                  <td style={{ color: '#3b82f6', fontWeight: 600 }}>₹{c.delivery_commission}</td>
                  <td style={{ color: '#f59e0b', fontWeight: 600 }}>₹{Number(c.restaurant_commission).toFixed(0)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(c.platform_profit).toFixed(0)}</td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No commissions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
