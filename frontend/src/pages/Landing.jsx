import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const floatAnim = {
  animate: { y: [0, -12, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }
};

const features = [
  { icon: '🍕', title: 'Order Food', desc: 'Browse hundreds of restaurants and get your favourite food delivered fast.' },
  { icon: '🏪', title: 'Own a Restaurant?', desc: 'Manage your menu, track orders and grow your business on QuickByte.' },
  { icon: '🛵', title: 'Deliver & Earn', desc: 'Join our delivery fleet and earn on every drop, on your own schedule.' },
  { icon: '📊', title: 'Admin Control', desc: 'Full-platform visibility, analytics, commissions, and user management.' },
];

const steps = [
  { n: '01', title: 'Sign Up', desc: 'Enter your mobile number and select your role.' },
  { n: '02', title: 'Browse & Order', desc: 'Pick your restaurant, choose items, and add to cart.' },
  { n: '03', title: 'Pay Securely', desc: 'Pay via UPI, Card, Wallet, or Cash on Delivery.' },
  { n: '04', title: 'Track & Enjoy', desc: 'Live tracking from prep to doorstep.' },
];

export default function Landing() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) { return <Navigate to="/dashboard" replace />; }

  return (
    <div style={{ background: '#080810', minHeight: '100vh', color: '#f0f0f8', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.8rem' }}>🍔</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>Quick<em style={{ color: '#FF6B35', fontStyle: 'normal' }}>Byte</em></span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 48px 60px', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, fontSize: '0.85rem', color: '#FF6B35', fontWeight: 600 }}>
            🚀 Food Delivery Platform
          </div>
          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Delicious food,<br />
            <span style={{ background: 'linear-gradient(135deg,#FF6B35,#FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              delivered fast.
            </span>
          </h1>
          <p style={{ color: 'rgba(240,240,248,0.6)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            QuickByte connects you with the best local restaurants. Order in minutes, track in real time, enjoy every bite.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Order Now 🍕</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[['500+', 'Restaurants'], ['50K+', 'Orders/day'], ['4.8★', 'Rating']].map(([val, lab]) => (
              <div key={lab}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FF6B35' }}>{val}</div>
                <div style={{ color: 'rgba(240,240,248,0.5)', fontSize: '0.85rem' }}>{lab}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3D Food Visual */}
        <motion.div {...floatAnim} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(255,107,53,0.25), transparent 70%)', border: '1px solid rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 80px rgba(255,107,53,0.12)' }}>
            <span style={{ fontSize: 120 }}>🍔</span>
            {/* Orbiting items */}
            {['🍕', '🍜', '🌮', '🍣'].map((emoji, i) => (
              <motion.div key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
              >
                <div style={{ transform: `rotate(${i * 90}deg) translateY(20px)`, fontSize: '2rem' }}>{emoji}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Outfit,sans-serif', fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>
          One platform, <span style={{ color: '#FF6B35' }}>four roles</span>
        </motion.h2>
        <div className="grid-4">
          {features.map((f, i) => (
            <motion.div key={f.title} className="card"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ cursor: 'default', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'rgba(240,240,248,0.55)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 48px', maxWidth: 1200, margin: '0 auto', background: 'rgba(255,255,255,0.02)', borderRadius: 24 }}>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>How it works</h2>
        <div className="grid-4">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }}
              style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Outfit', fontWeight: 800, color: '#FF6B35', fontSize: '1.1rem' }}>{s.n}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: 'rgba(240,240,248,0.55)', fontSize: '0.88rem', lineHeight: 1.6 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '2.5rem', fontWeight: 900, marginBottom: 16 }}>
            Ready to <span style={{ color: '#FF6B35' }}>dig in</span>?
          </h2>
          <p style={{ color: 'rgba(240,240,248,0.55)', marginBottom: 32 }}>Join thousands of happy customers. Sign up in 30 seconds.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 48px', textAlign: 'center', color: 'rgba(240,240,248,0.35)', fontSize: '0.85rem' }}>
        © 2024 QuickByte. Built with ❤️ for IIIT Delhi DIS Project.
      </footer>
    </div>
  );
}

