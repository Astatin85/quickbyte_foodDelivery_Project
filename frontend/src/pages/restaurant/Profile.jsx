import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function RestaurantProfile() {
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({ name: '', cuisine_type: '', address: '', city: '', phone: '', minimum_order_amount: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/restaurant/my').then(res => {
      if (res.data.length > 0) { setRestaurant(res.data[0]); setForm(res.data[0]); }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (!restaurant) { const res = await api.post('/restaurant/register', form); toast.success('Restaurant registered!'); const r = await api.get('/restaurant/my'); setRestaurant(r.data[0]); }
      else { await api.put(`/restaurant/${restaurant.restaurant_id}`, form); toast.success('Profile updated!'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏪 Restaurant Profile</h1>
        <p className="page-subtitle">{restaurant ? 'Update your restaurant details' : 'Register your restaurant'}</p>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group"><label className="input-label">Restaurant Name *</label><input className="input" required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Spice Garden" /></div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Cuisine Type</label>
              <select className="input" value={form.cuisine_type || ''} onChange={e => setForm(p => ({ ...p, cuisine_type: e.target.value }))}>
                <option value="">Select...</option>
                {['North Indian','South Indian','Chinese','Italian','Mexican','Fast Food','Biryani','Pizza','Burger','Desserts','Continental'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group"><label className="input-label">City</label><input className="input" value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Delhi" /></div>
          </div>
          <div className="input-group"><label className="input-label">Address</label><textarea className="input" rows={2} value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full restaurant address" /></div>
          <div className="grid-2">
            <div className="input-group"><label className="input-label">Phone</label><input className="input" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Restaurant contact number" /></div>
            <div className="input-group"><label className="input-label">Min Order (₹)</label><input className="input" type="number" value={form.minimum_order_amount || ''} onChange={e => setForm(p => ({ ...p, minimum_order_amount: e.target.value }))} placeholder="e.g. 150" /></div>
          </div>
          {restaurant && <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--success)' }}>
            ✅ Restaurant is live • ⭐ {restaurant.avg_rating ? Number(restaurant.avg_rating).toFixed(1) : 'N/A'} rating
          </div>}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving...' : restaurant ? '💾 Update Profile' : '🚀 Register Restaurant'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
