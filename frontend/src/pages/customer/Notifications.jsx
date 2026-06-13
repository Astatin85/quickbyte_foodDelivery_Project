import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const notifIcon = (msg) => {
  if (msg.includes('placed')) return '🆕';
  if (msg.includes('confirmed')) return '✅';
  if (msg.includes('preparing') || msg.includes('cook')) return '👨‍🍳';
  if (msg.includes('ready') || msg.includes('pickup')) return '🟢';
  if (msg.includes('picked up') || msg.includes('way')) return '🛵';
  if (msg.includes('delivered') || msg.includes('Enjoy')) return '🎉';
  if (msg.includes('cancelled')) return '❌';
  if (msg.includes('assigned')) return '📦';
  if (msg.includes('earned')) return '💰';
  return '🔔';
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function CustomerNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/notifications');
      setNotifs(res.data || []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🔔 My Notifications</h1>
          <p className="page-subtitle">{notifs.length} notification{notifs.length !== 1 ? 's' : ''} • updates every 30s</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? <div className="spinner" /> : notifs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔕</div>
          <h3>No notifications yet</h3>
          <p>You'll get notified here when your orders are updated</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
          {notifs.map((n, i) => (
            <motion.div key={n.notification_id}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                {notifIcon(n.message)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🕐 {timeAgo(n.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
