import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const statusOptions = ['CONFIRMED','PREPARING','READY_FOR_PICKUP','CANCELLED'];
const statusColor = { PLACED:'#3b82f6', CONFIRMED:'#f59e0b', PREPARING:'#8b5cf6', READY_FOR_PICKUP:'#22c55e', DELIVERED:'#22c55e', CANCELLED:'#ef4444' };

export default function RestaurantOrders() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async (rid) => {
    const params = statusFilter ? { status: statusFilter } : {};
    const res = await api.get(`/restaurant/${rid}/orders`, { params });
    setOrders(res.data);
  };

  useEffect(() => {
    api.get('/restaurant/my').then(res => {
      if (res.data.length > 0) { setRestaurant(res.data[0]); loadOrders(res.data[0].restaurant_id); }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (restaurant) loadOrders(restaurant.restaurant_id); }, [statusFilter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      loadOrders(restaurant.restaurant_id);
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">📦 Orders</h1><p className="page-subtitle">{orders.length} order(s)</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['','PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP','DELIVERED'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatusFilter(s)} style={{ fontSize: '0.78rem' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><h3>No orders</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((order, i) => (
            <motion.div key={order.order_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Order #{order.order_id}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.customer_name} • {new Date(order.created_at).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: `${statusColor[order.status] || '#666'}20`, color: statusColor[order.status] || '#666', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>{order.status}</span>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>₹{order.total_amount}</div>
                </div>
              </div>
              {order.items?.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                  {order.items.map(item => (
                    <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.87rem', padding: '4px 0' }}>
                      <span>{item.item_name} ×{item.quantity}</span>
                      {item.special_instruction && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{item.special_instruction}"</span>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>📍 {order.customer_address}</div>
              {['PLACED','CONFIRMED','PREPARING'].includes(order.status) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {statusOptions.map(s => (
                    <button key={s} className={`btn btn-sm ${s === 'CANCELLED' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => updateStatus(order.order_id, s)} style={{ fontSize: '0.78rem' }}>
                      {s === 'CONFIRMED' ? '✅ Confirm' : s === 'PREPARING' ? '👨‍🍳 Preparing' : s === 'READY_FOR_PICKUP' ? '📦 Ready' : '❌ Cancel'}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
