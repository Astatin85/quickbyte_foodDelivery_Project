import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
const VEHICLES = ['Bike', 'Scooter', 'Bicycle', 'Car', 'Electric Bike'];

export default function DeliveryProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone_no: '', vehicle_type: '', city: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/delivery/profile').then(res => {
      setProfile(res.data);
      setForm({ full_name: res.data.full_name || '', phone_no: res.data.phone_no || '', vehicle_type: res.data.vehicle_type || '', city: res.data.city || '' });
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/delivery/profile', form);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Min 6 characters required'); return; }
    setSavingPw(true);
    try {
      await api.put('/delivery/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">Manage your account and delivery details</p>
      </div>

      <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📝 Personal Information</h3>
          <form className="glass" onSubmit={handleSaveProfile} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" required />
            </div>
            <div className="input-group">
              <label className="input-label">📱 Phone Number</label>
              <input className="input" value={form.phone_no} onChange={e => setForm(p => ({ ...p, phone_no: e.target.value }))} placeholder="Contact number" />
            </div>
            <div className="input-group">
              <label className="input-label">📍 City <span style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>— you'll see orders from this city</span></label>
              <select className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}>
                <option value="">Select your city...</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">🚗 Vehicle Type</label>
              <select className="input" value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}>
                <option value="">Select vehicle...</option>
                {VEHICLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>🔒 Change Password</h3>
          <form className="glass" onSubmit={handleChangePassword} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Current Password</label>
              <input className="input" type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input className="input" type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input className="input" type="password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingPw} style={{ alignSelf: 'flex-start' }}>
              {savingPw ? 'Changing...' : '🔑 Change Password'}
            </button>
          </form>

          {profile && (
            <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Info</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛵</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{profile.full_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📱 {profile.phone_no || 'No phone'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {profile.city || 'City not set'} • {profile.vehicle_type || 'No vehicle'}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Rating Card ── */}
          {profile && (
            <div style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,107,53,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Rating</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>⭐</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1, color: '#f59e0b' }}>
                    {Number(profile.avg_rating || 0).toFixed(1)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                    out of 5.0 &nbsp;•&nbsp; based on customer reviews
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} style={{ fontSize: '1.1rem', filter: Math.round(profile.avg_rating || 0) >= star ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
                    ))}
                  </div>
                </div>
              </div>
              {(!profile.avg_rating || Number(profile.avg_rating) === 0) && (
                <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No ratings yet — complete your first delivery to get rated!
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
