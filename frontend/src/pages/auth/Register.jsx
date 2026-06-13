import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const roles = [
  { value: 'CUSTOMER', label: '🛒 Customer', desc: 'Order food from restaurants' },
  { value: 'RESTAURANT_OWNER', label: '🏪 Restaurant Owner', desc: 'Manage your restaurant' },
  { value: 'DELIVERY_PARTNER', label: '🛵 Delivery Partner', desc: 'Deliver and earn' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ auth_id: '', password: '', confirm: '', full_name: '', email: '', role: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (!form.role) { toast.error('Please select a role'); return; }
    if (form.auth_id.length !== 10) { toast.error('Enter valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      const { role } = await register({ auth_id: form.auth_id, password: form.password, role: form.role, full_name: form.full_name, email: form.email });
      toast.success('Account created! Welcome to QuickByte 🎉');
      switch (role) {
        case 'CUSTOMER': navigate('/customer/restaurants'); break;
        case 'RESTAURANT_OWNER': navigate('/restaurant/dashboard'); break;
        case 'DELIVERY_PARTNER': navigate('/delivery/dashboard'); break;
        default: navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.08) 0%, transparent 60%)' }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 32, textDecoration: 'none', color: '#f0f0f8' }}>
          <span style={{ fontSize: '1.6rem' }}>🍔</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>Quick<em style={{ color: '#FF6B35', fontStyle: 'normal' }}>Byte</em></span>
        </Link>
        <div className="glass" style={{ padding: 40 }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>Create account</h2>
          <p style={{ color: 'rgba(240,240,248,0.5)', marginBottom: 32, fontSize: '0.9rem' }}>Join QuickByte in seconds</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" type="text" placeholder="Your full name"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Mobile Number (auth ID)</label>
              <input className="input" type="tel" placeholder="10-digit mobile number" maxLength={10}
                value={form.auth_id} onChange={e => setForm({ ...form, auth_id: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Email (optional)</label>
              <input className="input" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Create a strong password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input className="input" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">I am a...</label>
              <div className="radio-group">
                {roles.map(r => (
                  <div key={r.value} className={`radio-option ${form.role === r.value ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, role: r.value })}>
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'rgba(240,240,248,0.5)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
