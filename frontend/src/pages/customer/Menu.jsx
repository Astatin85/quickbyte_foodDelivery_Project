import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/config';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function CustomerMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, total } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, mRes] = await Promise.all([
          api.get(`/customer/restaurants/${id}`),
          api.get(`/customer/restaurants/${id}/menu`),
        ]);
        setRestaurant(rRes.data);
        setMenu(mRes.data);
      } catch { toast.error('Failed to load menu'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const filtered = menu.filter(item =>
    filter === 'ALL' ? true : filter === 'VEG' ? item.is_vegetarian : !item.is_vegetarian
  );

  if (loading) return <div className="spinner" />;

  return (
    <div>
      {/* Restaurant header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 28, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0 }}>🍽️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: 4 }}>{restaurant?.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{restaurant?.cuisine_type} • {restaurant?.city}</p>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem' }}>
            <span>⭐ {restaurant?.avg_rating ? Number(restaurant.avg_rating).toFixed(1) : 'New'}</span>
            <span>📍 {restaurant?.address}</span>
            <span>📞 {restaurant?.phone}</span>
          </div>
        </div>
        {cartCount > 0 && (
          <button className="btn btn-primary" onClick={() => navigate('/customer/cart')}>
            🛒 View Cart ({cartCount}) — ₹{total.toFixed(0)}
          </button>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['ALL', 'VEG', 'NON-VEG'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Menu items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">🍽️</div><h3>No items found</h3></div> : filtered.map((item, i) => {
          const inCart = cart.find(c => c.item_id === item.item_id);
          return (
            <motion.div key={item.item_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', display: 'inline-block', width: 14, height: 14, borderRadius: 2, border: `2px solid ${item.is_vegetarian ? '#22c55e' : '#ef4444'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.is_vegetarian ? '#22c55e' : '#ef4444', display: 'block' }} />
                  </span>
                  <h4 style={{ fontWeight: 600 }}>{item.name}</h4>
                </div>
                {item.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>{item.description}</p>}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>⏱ {item.preparation_time} min</div>
                {item.availability_quantity !== undefined && item.availability_quantity !== null && (
                  <div style={{ fontSize: '0.78rem', marginTop: 2, color: item.availability_quantity <= 10 ? '#ef4444' : 'var(--text-dim)', fontWeight: item.availability_quantity <= 10 ? 700 : 400 }}>
                    {item.availability_quantity <= 0 ? '❌ Out of stock' : item.availability_quantity <= 10 ? `⚠️ Only ${item.availability_quantity} left!` : `✅ ${item.availability_quantity} available`}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>₹{item.price}</div>
                {!inCart ? (
                  <button className="btn btn-primary btn-sm" onClick={() => { addToCart(item, id); toast.success(`${item.name} added!`); }}>+ Add</button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }} onClick={() => removeFromCart(item.item_id)}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{inCart.quantity}</span>
                    <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }} onClick={() => addToCart(item, id)}>+</button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
