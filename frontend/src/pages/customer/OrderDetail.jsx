import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const statusSteps = ['PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'];
const statusLabel = { PLACED:'Order Placed', CONFIRMED:'Confirmed', PREPARING:'Preparing', READY_FOR_PICKUP:'Ready for Pickup', OUT_FOR_DELIVERY:'Out for Delivery', DELIVERED:'Delivered', CANCELLED:'Cancelled' };
const statusEmoji = { PLACED:'📋', CONFIRMED:'✅', PREPARING:'👨‍🍳', READY_FOR_PICKUP:'📦', OUT_FOR_DELIVERY:'🛵', DELIVERED:'🎉', CANCELLED:'❌' };

/* ─── Star Picker ─────────────────────────────── */
function StarPicker({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[1,2,3,4,5].map(star => (
          <span
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            style={{
              fontSize: '1.8rem',
              cursor: 'pointer',
              transition: 'transform 0.15s',
              transform: (hovered || value) >= star ? 'scale(1.2)' : 'scale(1)',
              filter: (hovered || value) >= star ? 'none' : 'grayscale(1) opacity(0.3)',
              userSelect: 'none',
            }}
          >⭐</span>
        ))}
        <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
          {value}/5
        </span>
      </div>
    </div>
  );
}

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({ restaurant_rating: 5, delivery_rating: 5, restaurant_review: '', delivery_review: '' });
  const [rated, setRated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/customer/orders/${id}`);
        setOrder(res.data);
        if (res.data.rating) setRated(true); // already rated
      } catch { toast.error('Order not found'); }
      finally { setLoading(false); }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const submitRating = async () => {
    setSubmitting(true);
    try {
      await api.post('/customer/ratings', { order_id: parseInt(id), ...rating });
      toast.success('Rating submitted! Thank you ⭐');
      setRated(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit rating');
    } finally { setSubmitting(false); }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.put(`/customer/orders/${id}/cancel`);
      toast.success('Order cancelled.');
      // Refresh the order details to show updated status
      const res = await api.get(`/customer/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      // This is where Scenario 2 conflict surfaces to the user:
      // "Cannot cancel — order is already 'PREPARING'. Contact the restaurant."
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally { setCancelling(false); }
  };

  if (loading) return <div className="spinner" />;
  if (!order) return <div className="empty-state"><div className="empty-icon">❌</div><h3>Order not found</h3></div>;

  const stepIndex = statusSteps.indexOf(order.status);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/customer/orders')}>← Back</button>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>Order #{id}</h1>
      </div>

      {/* Progress tracker */}
      {order.status !== 'CANCELLED' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 24 }}>📍 Live Tracking</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: '6%', right: '6%', height: 2, background: 'var(--border)', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: 20, left: '6%', width: `${(Math.max(stepIndex, 0) / (statusSteps.length - 1)) * 88}%`, height: 2, background: 'var(--primary)', zIndex: 1, transition: 'width 0.8s ease' }} />
            {statusSteps.map((step, i) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2, flex: 1 }}>
                <motion.div animate={{ scale: i === stepIndex ? [1, 1.2, 1] : 1 }} transition={{ repeat: i === stepIndex ? Infinity : 0, duration: 1.5 }}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: i <= stepIndex ? 'var(--primary)' : 'var(--bg-3)', border: `2px solid ${i <= stepIndex ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {statusEmoji[step]}
                </motion.div>
                <div style={{ fontSize: '0.7rem', color: i <= stepIndex ? 'var(--text)' : 'var(--text-muted)', textAlign: 'center', maxWidth: 80 }}>{statusLabel[step]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Order items */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🍽️ Items Ordered</h3>
          {order.items?.map(item => (
            <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
              <span>{item.item_name} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, padding: '14px 0 0', fontSize: '1.05rem' }}>
            <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{order.total_amount}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            📍 {order.customer_address}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cancel order button — shown only for PLACED/CONFIRMED orders */}
          {['PLACED', 'CONFIRMED'].includes(order.status) && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>❌ Cancel Order</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                You can cancel while the order is <strong>Placed</strong> or <strong>Confirmed</strong>.<br />
                If the restaurant has already started preparing, cancellation will be refused.
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={cancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : '❌ Cancel This Order'}
              </button>
            </div>
          )}

          {/* Delivery partner */}
          {order.delivery && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🛵 Delivery Partner</h3>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🧑</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.delivery.partner_name || 'Assigned'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.delivery.partner_phone && `📞 ${order.delivery.partner_phone}`}</div>
                  <span className={`badge badge-${order.delivery.status?.toLowerCase()}`} style={{ marginTop: 4 }}>{order.delivery.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Rating panel ─────────────────── */}
          {order.status === 'DELIVERED' && !rated && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 'var(--radius)', padding: 24 }}
            >
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>⭐ Rate Your Experience</h3>

              {/* Restaurant */}
              <div style={{ marginBottom: 14, padding: 16, background: 'var(--bg-2)', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>🍽️ Restaurant</div>
                <StarPicker
                  label="How was the food?"
                  value={rating.restaurant_rating}
                  onChange={v => setRating(p => ({ ...p, restaurant_rating: v }))}
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Write a review for the restaurant… (optional)"
                  value={rating.restaurant_review}
                  onChange={e => setRating(p => ({ ...p, restaurant_review: e.target.value }))}
                  style={{ marginTop: 10, resize: 'none' }}
                />
              </div>

              {/* Delivery partner */}
              <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-2)', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>🛵 Delivery Partner</div>
                <StarPicker
                  label="How was the delivery?"
                  value={rating.delivery_rating}
                  onChange={v => setRating(p => ({ ...p, delivery_rating: v }))}
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Write a review for the delivery partner… (optional)"
                  value={rating.delivery_review}
                  onChange={e => setRating(p => ({ ...p, delivery_review: e.target.value }))}
                  style={{ marginTop: 10, resize: 'none' }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={submitRating}
                disabled={submitting}
                style={{ width: '100%', fontSize: '1rem', padding: '12px' }}
              >
                {submitting ? 'Submitting…' : '⭐ Submit Rating'}
              </button>
            </motion.div>
          )}

          {/* Already rated */}
          {rated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>Rating submitted! Thank you!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                The restaurant and delivery partner have been notified.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
