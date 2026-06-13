import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const [profile, setProfile] = useState(null);
  const [current, setCurrent] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [accepting, setAccepting] = useState(null); // order_id being accepted

  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/delivery/profile'),
        api.get('/delivery/current'),
      ]);
      setProfile(pRes.data);
      setCurrent(cRes.data);
      // Load available orders if no current delivery and is online
      if (!cRes.data && pRes.data?.is_available) {
        const aRes = await api.get('/delivery/available-orders');
        setAvailableOrders(aRes.data || []);
      } else {
        setAvailableOrders([]);
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const i = setInterval(loadData, 20000);
    return () => clearInterval(i);
  }, []);

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      const newVal = !profile.is_available;
      await api.put('/delivery/availability', { is_available: newVal });
      setProfile(p => ({ ...p, is_available: newVal }));
      toast.success(newVal ? '🟢 You are now Online' : '🔴 You are now Offline');
      if (newVal) {
        const aRes = await api.get('/delivery/available-orders');
        setAvailableOrders(aRes.data || []);
      } else {
        setAvailableOrders([]);
      }
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const acceptOrder = async (orderId) => {
    setAccepting(orderId);
    try {
      await api.post(`/delivery/accept/${orderId}`);
      toast.success('Order accepted! Head to the restaurant to pick it up.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    } finally { setAccepting(null); }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      await api.put(`/delivery/${deliveryId}/status`, { status });
      toast.success(status === 'PICKED_UP' ? '📦 Picked up! Head to customer.' : '🎉 Delivered!');
      loadData();
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🛵 Delivery Dashboard</h1>
        <p className="page-subtitle">
          {profile?.city ? `Serving orders in ${profile.city}` : 'Set your city in My Profile to see orders'}
        </p>
      </div>

      {/* Availability toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: profile?.is_available ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${profile?.is_available ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
            {profile?.is_available ? '🟢 You are Online' : '🔴 You are Offline'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {profile?.is_available ? 'You can accept orders below' : 'Toggle to start accepting deliveries'}
            {profile?.city && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>• {profile.city}</span>}
          </div>
        </div>
        <button
          className={`btn ${profile?.is_available ? 'btn-danger' : 'btn-success'}`}
          onClick={toggleAvailability} disabled={updating || !!current}>
          {updating ? '...' : profile?.is_available ? 'Go Offline' : 'Go Online'}
        </button>
      </motion.div>

      {/* Active delivery */}
      {current ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>🎯 Active Delivery — Order #{current.order_id}</h3>
          <div className="grid-2">
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>📦 Pickup From:</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{current.restaurant_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: 16 }}>{current.restaurant_address}</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>🏠 Deliver To:</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{current.customer_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>{current.customer_address}</div>
              {current.customer_phone && <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {current.customer_phone}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '1.8rem', color: 'var(--primary)', marginBottom: 8 }}>₹{current.total_amount}</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--primary)', padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 }}>
                  {current.status}
                </span>
              </div>
              {current.status === 'ASSIGNED' && (
                <button className="btn btn-primary" onClick={() => updateDeliveryStatus(current.delivery_id, 'PICKED_UP')}>
                  ✅ Mark as Picked Up
                </button>
              )}
              {current.status === 'PICKED_UP' && (
                <button className="btn btn-success" onClick={() => updateDeliveryStatus(current.delivery_id, 'DELIVERED')}>
                  🎉 Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : profile?.is_available ? (
        /* Available Orders list */
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              📋 Available Orders {profile?.city && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>in {profile.city}</span>}
            </h3>
            <button className="btn btn-outline btn-sm" onClick={loadData}>↻ Refresh</button>
          </div>
          <AnimatePresence>
            {availableOrders.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🕐</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No orders yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  {profile?.city ? `Waiting for READY_FOR_PICKUP orders in ${profile.city}...` : 'Set your city in My Profile to see local orders'}
                </p>
              </div>
            ) : availableOrders.map((o, i) => (
              <motion.div key={o.order_id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Order #{o.order_id}</span>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)', padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>
                      🟢 READY
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>{o.restaurant_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>📍 {o.restaurant_address}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: 2 }}>🏠 Deliver to: {o.customer_address}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)', marginBottom: 10 }}>₹{o.total_amount}</div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => acceptOrder(o.order_id)}
                    disabled={accepting === o.order_id}
                    style={{ minWidth: 100 }}
                  >
                    {accepting === o.order_id ? 'Accepting...' : '✅ Accept'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛵</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>You're Offline</h3>
          <p style={{ color: 'var(--text-muted)' }}>Click "Go Online" above to start seeing available orders</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3">
        {[
          { label: 'Avg Rating', value: Number(profile?.avg_rating || 0).toFixed(1) + ' ⭐', icon: '⭐', color: '#f59e0b' },
          { label: 'Total Deliveries', value: profile?.total_deliveries || 0, icon: '📦', color: '#3b82f6' },
          { label: 'Vehicle', value: profile?.vehicle_type || '—', icon: '🚗', color: '#8b5cf6' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}20` }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
