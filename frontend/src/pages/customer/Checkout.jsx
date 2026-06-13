import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/config';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const paymentMethods = [
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'Pay via GPay, PhonePe, Paytm' },
  { id: 'CARD', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'WALLET', label: 'Wallet', icon: '👛', desc: 'Paytm, Amazon Pay' },
  { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
];

export default function CustomerCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { clearCart, cart } = useCart();
  const [address, setAddress] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!state?.cart?.length) { navigate('/customer/cart'); return null; }

  const { total, deliveryFee, restaurant_id } = state;

  const handleOrder = async () => {
    if (!address.trim()) { toast.error('Enter delivery address'); return; }
    setLoading(true);
    try {
      const orderRes = await api.post('/customer/orders', {
        restaurant_id,
        items: cart.map(i => ({ item_id: i.item_id, quantity: i.quantity, special_instruction: '' })),
        customer_address: address,
        delivery_charges: deliveryFee,
        total_amount: total,
      });
      const order_id = orderRes.data.order_id;
      await api.post('/customer/payments', { order_id, amount: total, payment_method: payMethod });
      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/customer/orders/${order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✅ Checkout</h1>
        <p className="page-subtitle">Almost there! Confirm your order</p>
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Delivery address */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📍 Delivery Address</h3>
            <textarea className="input" rows={3} placeholder="Enter your full delivery address..."
              value={address} onChange={e => setAddress(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>
          {/* Payment method */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💳 Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paymentMethods.map(pm => (
                <div key={pm.id}
                  onClick={() => setPayMethod(pm.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: `1px solid ${payMethod === pm.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: payMethod === pm.id ? 'rgba(255,107,53,0.07)' : 'transparent', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.5rem' }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pm.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{pm.desc}</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === pm.id ? 'var(--primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {payMethod === pm.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </div>
                </div>
              ))}
            </div>
            {payMethod === 'UPI' && (
              <input className="input" style={{ marginTop: 12 }} placeholder="Enter UPI ID (e.g. name@paytm)"
                value={upiId} onChange={e => setUpiId(e.target.value)} />
            )}
          </div>
        </div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, position: 'sticky', top: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {cart.map(item => (
              <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.name} ×{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>₹{(total - deliveryFee - Math.round((total - deliveryFee - Math.round((total - deliveryFee) * 0.05 / 1.05)) * 0.05)).toFixed(0)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Delivery</span><span>₹{deliveryFee}</span></div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
              <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{total}</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleOrder} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
            {loading ? 'Placing Order...' : `Pay ₹${total} & Place Order`}
          </button>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 12 }}>🔒 Secure & encrypted payment</p>
        </motion.div>
      </div>
    </div>
  );
}
