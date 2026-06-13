import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const empty = { name: '', price: '', is_vegetarian: true, preparation_time: '', description: '', quantity: '', is_available: true };

export default function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    api.get('/restaurant/my').then(res => {
      if (res.data.length > 0) { setRestaurant(res.data[0]); loadMenu(res.data[0].restaurant_id); }
    }).finally(() => setLoading(false));
  }, []);

  const loadMenu = async (rid) => {
    const res = await api.get(`/restaurant/${rid}/menu`);
    setItems(res.data);
  };

  const openAdd = () => { setForm(empty); setEditId(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item, quantity: item.availability_quantity }); setEditId(item.item_id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/restaurant/menu/${editId}`, form); toast.success('Item updated!'); }
      else { await api.post(`/restaurant/${restaurant.restaurant_id}/menu`, form); toast.success('Item added!'); }
      loadMenu(restaurant.restaurant_id);
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleAvailable = async (item) => {
    try {
      await api.put(`/restaurant/menu/${item.item_id}`, { ...item, quantity: item.availability_quantity, is_available: !item.is_available });
      loadMenu(restaurant.restaurant_id);
    } catch { toast.error('Failed'); }
  };

  const deleteItem = async (item_id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/restaurant/menu/${item_id}`); toast.success('Deleted'); loadMenu(restaurant.restaurant_id); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="spinner" />;
  if (!restaurant) return <div className="empty-state"><div className="empty-icon">🏪</div><h3>Register your restaurant first</h3></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">🍽️ Menu Management</h1><p className="page-subtitle">{items.length} items on menu</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <motion.div key={item.item_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, border: `2px solid ${item.is_vegetarian ? '#22c55e' : '#ef4444'}`, flexShrink: 0 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.is_vegetarian ? '#22c55e' : '#ef4444', margin: 1.5 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              {item.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{item.description}</div>}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>⏱ {item.preparation_time} min • Qty: <span style={{ color: item.availability_quantity < 10 ? '#ef4444' : 'var(--text-dim)', fontWeight: item.availability_quantity < 10 ? 700 : 400 }}>{item.availability_quantity ?? '—'}</span></div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', minWidth: 70, textAlign: 'right' }}>₹{item.price}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className={`btn btn-sm ${item.is_available ? 'btn-success' : 'btn-outline'}`} onClick={() => toggleAvailable(item)} style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                {item.is_available ? '✅ Live' : '⏸ Off'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.item_id)}>🗑️</button>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && <div className="empty-state"><div className="empty-icon">🍽️</div><h3>No menu items yet</h3><button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>Add First Item</button></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Item' : 'Add Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group"><label className="input-label">Item Name *</label><input className="input" required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Price (₹) *</label><input className="input" type="number" required value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label">Prep Time (min)</label><input className="input" type="number" value={form.preparation_time || ''} onChange={e => setForm(p => ({ ...p, preparation_time: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label className="input-label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid-2">
                <div className="input-group"><label className="input-label">Quantity</label><input className="input" type="number" value={form.quantity || ''} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select className="input" value={form.is_vegetarian ? 'veg' : 'nonveg'} onChange={e => setForm(p => ({ ...p, is_vegetarian: e.target.value === 'veg' }))}>
                    <option value="veg">🟢 Vegetarian</option>
                    <option value="nonveg">🔴 Non-Vegetarian</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{editId ? 'Update Item' : 'Add Item'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
