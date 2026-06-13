import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ auth_id: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { role } = await login(form.auth_id, form.password);
      toast.success('Welcome back! 🎉');
      switch (role) {
        case 'CUSTOMER': navigate('/customer/restaurants'); break;
        case 'RESTAURANT_OWNER': navigate('/restaurant/dashboard'); break;
        case 'DELIVERY_PARTNER': navigate('/delivery/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        default: navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.08) 0%, transparent 60%)' }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 32, textDecoration: 'none', color: '#f0f0f8' }}>
          <span style={{ fontSize: '1.6rem' }}>🍔</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>Quick<em style={{ color: '#FF6B35', fontStyle: 'normal' }}>Byte</em></span>
        </Link>
        <div className="glass" style={{ padding: 40 }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>Welcome back</h2>
          <p style={{ color: 'rgba(240,240,248,0.5)', marginBottom: 32, fontSize: '0.9rem' }}>Sign in with your mobile number</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <input className="input" type="tel" placeholder="10-digit mobile number"
                value={form.auth_id} onChange={e => setForm({ ...form, auth_id: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', color: 'rgba(240,240,248,0.5)', fontSize: '0.9rem' }}>
            Don't have an account? <Link to="/register" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
