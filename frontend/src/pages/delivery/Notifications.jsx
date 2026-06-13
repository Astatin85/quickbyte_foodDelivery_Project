import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function DeliveryNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/notifications')
      .then(res => setNotifications(res.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔔 Notifications</h1>
        <p className="page-subtitle">Your latest rating alerts and delivery updates</p>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>Rating alerts and delivery updates will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((n, i) => (
            <motion.div
              key={n.notification_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(255,107,53,0.3)'}`,
                borderRadius: 'var(--radius)',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              {!n.is_read && (
                <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
