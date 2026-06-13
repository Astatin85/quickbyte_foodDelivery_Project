import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

const statusColor = {
  PLACED: '#3b82f6', CONFIRMED: '#f59e0b', PREPARING: '#8b5cf6',
  READY_FOR_PICKUP: '#22c55e', OUT_FOR_DELIVERY: '#FF6B35',
  DELIVERED: '#22c55e', CANCELLED: '#ef4444'
};
const STATUSES = ['', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/orders', { params: statusFilter ? { status: statusFilter } : {} })
      .then(res => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  // Client-side search by order ID, customer name, or restaurant name
  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(o.order_id).includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.restaurant_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Orders Monitor</h1>
        <p className="page-subtitle">{filtered.length} of {orders.length} orders</p>
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 400 }}>
        <span>🔍</span>
        <input
          placeholder="Search by Order ID, customer, or restaurant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}>✕</button>
        )}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          >
            {s || 'All Status'}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.order_id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.order_id}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.restaurant_name}</td>
                  <td style={{ fontWeight: 700 }}>₹{o.total_amount}</td>
                  <td>
                    <span style={{ background: `${statusColor[o.status] || '#666'}20`, color: statusColor[o.status] || '#888', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {search ? `No orders matching "${search}"` : 'No orders found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
