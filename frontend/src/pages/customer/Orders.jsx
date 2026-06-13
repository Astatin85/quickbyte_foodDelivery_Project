import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const statusClass = {
  PLACED: 'badge-placed', CONFIRMED: 'badge-confirmed', PREPARING: 'badge-preparing',
  READY_FOR_PICKUP: 'badge-ready', OUT_FOR_DELIVERY: 'badge-out', DELIVERED: 'badge-delivered', CANCELLED: 'badge-cancelled'
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/customer/orders').then(res => setOrders(res.data)).catch(() => toast.error('Failed to load orders')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 My Orders</h1>
        <p className="page-subtitle">Track all your orders</p>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Start by ordering from a restaurant</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/customer/restaurants')}>Order Now</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((order, i) => (
            <motion.div key={order.order_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, cursor: 'pointer' }}
              onClick={() => navigate(`/customer/orders/${order.order_id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontWeight: 700 }}>{order.restaurant_name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{order.cuisine_type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${statusClass[order.status] || 'badge-placed'}`}>{order.status}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order #{order.order_id}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{order.total_amount}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
