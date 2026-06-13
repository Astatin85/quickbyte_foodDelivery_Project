import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

const ROLES = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'];
const roleLabel = { CUSTOMER: '🧑 Customer', RESTAURANT_OWNER: '🏪 Restaurant Owner', DELIVERY_PARTNER: '🛵 Delivery Partner' };
const roleColor = { CUSTOMER: '#3b82f6', RESTAURANT_OWNER: '#f59e0b', DELIVERY_PARTNER: '#8b5cf6' };

export default function AdminNotifications() {
  const [form, setForm] = useState({ receiver_role: 'CUSTOMER', receiver_id: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [search, setSearch] = useState('');

  const loadNotifs = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/admin/notifications');
      setRecentNotifs(res.data);
    } catch { /* silent */ }
    finally { setLoadingNotifs(false); }
  };

  useEffect(() => { loadNotifs(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.receiver_id.trim()) { toast.error('Receiver ID is required'); return; }
    setLoading(true);
    try {
      await api.post('/admin/notifications', form);
      toast.success('Notification sent!');
      setForm(p => ({ ...p, receiver_id: '', message: '' }));
      loadNotifs(); // refresh list
    } catch { toast.error('Failed to send'); }
    finally { setLoading(false); }
  };

  const filteredNotifs = recentNotifs.filter(n => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.message?.toLowerCase().includes(q) || String(n.receiver_id).includes(q);
  });

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔔 Notification Center</h1>
        <p className="page-subtitle">Send manual notifications and view system notifications</p>
      </div>

      <div className="grid-2" style={{ gap: 28, alignItems: 'start' }}>
        {/* Send Notification Form */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>📤 Send Notification</h3>
          <form className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={handleSend}>
            <div className="input-group">
              <label className="input-label">Recipient Role</label>
              <select className="input" value={form.receiver_role} onChange={e => setForm(p => ({ ...p, receiver_role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Recipient ID <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(customer_id / owner_id / dp_id)</span></label>
              <input className="input" placeholder="e.g. 1" value={form.receiver_id} onChange={e => setForm(p => ({ ...p, receiver_id: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea className="input" rows={4} placeholder="Enter your message..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Sending...' : '📤 Send Notification'}
            </button>
          </form>
        </div>

        {/* Recent Notifications panel */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>🕐 Recent Notifications ({filteredNotifs.length})</h3>
            <button className="btn btn-outline btn-sm" onClick={loadNotifs}>↻ Refresh</button>
          </div>

          {/* Search */}
          <div className="search-bar" style={{ marginBottom: 12 }}>
            <span>🔍</span>
            <input placeholder="Search by message or receiver ID..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {loadingNotifs ? <div className="spinner" style={{ margin: '20px auto' }} /> :
              filteredNotifs.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-icon">🔕</div>
                  <h3>No notifications yet</h3>
                  <p>Notifications will appear here as orders are processed</p>
                </div>
              ) : filteredNotifs.map(n => (
                <div key={n.notification_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${roleColor[n.receiver_role] || '#666'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {n.receiver_role === 'CUSTOMER' ? '🧑' : n.receiver_role === 'RESTAURANT_OWNER' ? '🏪' : '🛵'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: roleColor[n.receiver_role] || '#888' }}>
                        {n.receiver_role} #{n.receiver_id}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '0.87rem', color: 'var(--text)', lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
