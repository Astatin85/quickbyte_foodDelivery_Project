import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function DeliveryHistory() {
  const [data, setData] = useState({ summary: {}, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/earnings').then(res => setData(res.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 History & Earnings</h1>
        <p className="page-subtitle">Your delivery earnings and history</p>
      </div>
      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>💰</div>
          <div><div className="stat-value">₹{data.summary?.total_earnings || 0}</div><div className="stat-label">Total Earnings</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>📦</div>
          <div><div className="stat-value">{data.summary?.total_deliveries || 0}</div><div className="stat-label">Total Deliveries</div></div>
        </div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Deliveries</h3>
        {data.recent.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📦</div><h3>No deliveries yet</h3></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Order ID','Delivery Commission','Date'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{h}</th>)}</tr></thead>
            <tbody>
              {data.recent.map(d => (
                <tr key={d.commission_id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>#{d.order_id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--success)' }}>₹{d.delivery_commission}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(d.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
