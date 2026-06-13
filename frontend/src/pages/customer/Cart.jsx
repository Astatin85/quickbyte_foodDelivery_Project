import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';

export default function CustomerCart() {
  const { cart, addToCart, removeFromCart, clearCart, total } = useCart();
  const navigate = useNavigate();
  const deliveryFee = cart.length > 0 ? 40 : 0;
  const taxes = Math.round(total * 0.05);
  const grandTotal = total + deliveryFee + taxes;

  if (cart.length === 0) return (
    <div>
      <div className="page-header"><h1 className="page-title">🛒 Your Cart</h1></div>
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some delicious items from a restaurant</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/customer/restaurants')}>Browse Restaurants</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🛒 Your Cart</h1>
          <p className="page-subtitle">{cart.length} item(s) ready to order</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={clearCart}>Clear Cart</button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.map((item, i) => (
            <motion.div key={item.item_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }} onClick={() => removeFromCart(item.item_id)}>−</button>
                <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }} onClick={() => addToCart(item, item.restaurant_id)}>+</button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bill summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, position: 'sticky', top: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Bill Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Item Total</span><span>₹{total.toFixed(0)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span><span>₹{deliveryFee}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Taxes (5%)</span><span>₹{taxes}</span></div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
              <span>Grand Total</span><span style={{ color: 'var(--primary)' }}>₹{grandTotal}</span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
            onClick={() => navigate('/customer/checkout', { state: { cart, total: grandTotal, deliveryFee, restaurant_id: cart[0]?.restaurant_id } })}>
            Proceed to Checkout →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
