import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];

export default function CustomerProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone_no: '', address: '', city: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/customer/profile').then(res => {
      setProfile(res.data);
      setForm({ full_name: res.data.full_name || '', phone_no: res.data.phone_no || '', address: res.data.address || '', city: res.data.city || '' });
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/customer/profile', form);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('New passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/customer/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
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
        <p className="page-subtitle">Manage your account details</p>
      </div>

      <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
        {/* Profile form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📝 Personal Information</h3>
          <form className="glass" onSubmit={handleSaveProfile} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" required />
            </div>
            <div className="input-group">
              <label className="input-label">📱 Mobile Number</label>
              <input className="input" value={form.phone_no} onChange={e => setForm(p => ({ ...p, phone_no: e.target.value }))} placeholder="10-digit mobile" />
            </div>
            <div className="input-group">
              <label className="input-label">📍 City <span style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>— affects which restaurants you see</span></label>
              <select className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}>
                <option value="">Select your city...</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">🏠 Default Address</label>
              <textarea className="input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Door no, street, area..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Password change */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>🔒 Change Password</h3>
          <form className="glass" onSubmit={handleChangePassword} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-group">
              <label className="input-label">Current Password</label>
              <input className="input" type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} placeholder="Your current password" required />
            </div>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input className="input" type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} placeholder="New password (min 6 chars)" required />
            </div>
            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input className="input" type="password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} placeholder="Re-enter new password" required />
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingPw} style={{ alignSelf: 'flex-start' }}>
              {savingPw ? 'Changing...' : '🔑 Change Password'}
            </button>
          </form>

          {/* Account info card */}
          {profile && (
            <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Info</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧑</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{profile.full_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📱 {profile.phone_no || 'No phone'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {profile.city || 'City not set'}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
