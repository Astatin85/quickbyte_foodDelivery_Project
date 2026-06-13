import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const queries = [
  { id: 'above-avg-rating', title: '1. Above Average Rating Restaurants', emoji: '⭐', desc: 'Restaurants with rating above platform average', color: '#f59e0b' },
  { id: 'multi-restaurant-customers', title: '2. Multi-Restaurant Customers', emoji: '🌐', desc: 'Customers who ordered from 3+ restaurants', color: '#8b5cf6' },
  { id: 'highest-revenue-restaurant', title: '3. Highest Revenue Restaurant', emoji: '💰', desc: 'Restaurant with maximum total revenue', color: '#22c55e' },
  { id: 'never-ordered-customers', title: '4. Never Ordered Customers', emoji: '🚫', desc: 'Customers who have never placed an order (NOT EXISTS)', color: '#ef4444' },
  { id: 'top-delivery-partner', title: '5. Top Rated Delivery Partner', emoji: '🛵', desc: 'Partner with highest average rating', color: '#06b6d4' },
  { id: 'most-ordered-items', title: '6. Most Ordered Menu Items', emoji: '🍽️', desc: 'Items by total quantity ordered per restaurant', color: '#FF6B35' },
  { id: 'high-spending-customers', title: '7. High Spending Customers', emoji: '💳', desc: 'Customers spending above platform average', color: '#f59e0b' },
  { id: 'never-rated-restaurants', title: '8. Never Rated Restaurants', emoji: '📭', desc: 'Restaurants with no ratings yet (LEFT JOIN)', color: '#6b7280' },
  { id: 'top-delivery-partners-count', title: '9. Power Delivery Partners', emoji: '🏆', desc: 'Partners with 10+ deliveries completed', color: '#22c55e' },
  { id: 'most-menu-items-restaurant', title: '10. Richest Menu Restaurant', emoji: '📋', desc: 'Restaurant with most menu items', color: '#8b5cf6' },
  { id: 'large-quantity-orders', title: '11. Bulk Orders (5+ items)', emoji: '📦', desc: 'Orders with total quantity > 5', color: '#3b82f6' },
  { id: 'top-3-customers', title: '12. Top 3 Big Spenders', emoji: '👑', desc: 'Top 3 customers by total spending', color: '#FFD700' },
  { id: 'high-avg-order-restaurants', title: '13. Premium Restaurants', emoji: '🎖️', desc: 'Restaurants with avg order value > ₹500', color: '#f59e0b' },
  { id: 'veg-only-orders', title: '14. Veg-Only Orders', emoji: '🥗', desc: 'Orders containing only vegetarian items (NOT EXISTS)', color: '#22c55e' },
  { id: 'unassigned-delivery-partners', title: '15. Unassigned Partners', emoji: '🤷', desc: 'Partners who never received any order (LEFT JOIN)', color: '#ef4444' },
];

const renderTable = (data) => {
  if (!data || data.length === 0) return <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No data found</div>;
  const cols = Object.keys(data[0]);
  return (
    <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead><tr style={{ background: 'rgba(255,255,255,0.03)' }}>{cols.map(c => <th key={c} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>)}</tr></thead>
        <tbody>{data.map((row, i) => <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>{cols.map(c => <td key={c} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{row[c] !== null ? String(row[c]) : '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
};

export default function AdminAnalytics() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const runQuery = async (qid) => {
    setLoading(p => ({ ...p, [qid]: true }));
    try {
      const res = await api.get(`/analytics/${qid}`);
      setResults(p => ({ ...p, [qid]: res.data }));
    } catch { toast.error('Query failed'); }
    finally { setLoading(p => ({ ...p, [qid]: false })); }
  };

  const runAll = () => queries.forEach(q => runQuery(q.id));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">📈 Analytics</h1><p className="page-subtitle">15 advanced SQL queries</p></div>
        <button className="btn btn-primary" onClick={runAll}>▶ Run All Queries</button>
      </div>
      <div className="grid-2">
        {queries.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.1rem' }}>{q.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{q.title}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{q.desc}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => runQuery(q.id)} disabled={loading[q.id]} style={{ fontSize: '0.75rem', flexShrink: 0, marginLeft: 12 }}>
                {loading[q.id] ? '⏳' : '▶ Run'}
              </button>
            </div>
            <div style={{ minHeight: 60 }}>
              {results[q.id] !== undefined ? renderTable(results[q.id]) : (
                <div style={{ padding: 16, color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center' }}>Click Run to execute</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
