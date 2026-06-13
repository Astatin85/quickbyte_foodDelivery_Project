import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── SQL snippets for each scenario ──────────────────────────────
const SCENARIOS = [
  {
    id: 1,
    emoji: '📦',
    title: 'Stock Quantity Conflict',
    subtitle: 'Two customers race to order the last item in stock',
    color: '#ef4444',
    conflictType: 'Lost Update / Race Condition',
    table: 'menu_items (availability_quantity)',
    description:
      'When only 1 unit of a menu item remains, two customers submit orders simultaneously. Both transactions read qty=1, both reduce it, and the quantity can go negative — or one order gets confirmed for a non-existent item.',
    t1Label: 'Customer A',
    t2Label: 'Customer B',
    conflictLine: "T2's SELECT … FOR UPDATE blocks until T1 commits. After unblocking it reads qty=0 and must ROLLBACK.",
    t1Steps: [
      { comment: 'T1 begins', sql: 'START TRANSACTION;' },
      { comment: 'T1 locks the row — T2 will BLOCK here', sql: "SELECT item_id, availability_quantity\nFROM   menu_items\nWHERE  item_id = 1\nFOR UPDATE;  -- reads qty = 1" },
      { comment: 'T1 claims the last unit', sql: "UPDATE menu_items\nSET    availability_quantity = availability_quantity - 1\nWHERE  item_id = 1;" },
      { comment: 'T1 commits → qty is now 0', sql: 'COMMIT;' },
    ],
    t2Steps: [
      { comment: 'T2 begins', sql: 'START TRANSACTION;' },
      { comment: '⚠️ BLOCKS until T1 commits, then reads qty=0', sql: "SELECT item_id, availability_quantity\nFROM   menu_items\nWHERE  item_id = 1\nFOR UPDATE;" },
      { comment: '⚠️ qty=0 → item out of stock → ROLLBACK', sql: 'ROLLBACK;  -- Customer B: "Item out of stock"' },
    ],
  },
  {
    id: 2,
    emoji: '🔄',
    title: 'Order Status Conflict',
    subtitle: 'Customer cancels while restaurant marks order as Preparing',
    color: '#f59e0b',
    conflictType: 'Conflicting Updates / Lost Update',
    table: 'orders (status)',
    description:
      'Order is CONFIRMED. The restaurant starts cooking (sets PREPARING) at the same moment the customer hits "Cancel". The last write wins — if the customer commits after the restaurant, PREPARING is silently overwritten with CANCELLED.',
    t1Label: 'Restaurant',
    t2Label: 'Customer',
    conflictLine: "T2 reads 'CONFIRMED' (T1 not yet committed) and updates to 'CANCELLED'. If T2 commits after T1, PREPARING is overwritten — a Lost Update.",
    t1Steps: [
      { comment: 'T1 begins', sql: 'START TRANSACTION;' },
      { comment: 'Restaurant reads CONFIRMED → safe to cook', sql: "SELECT order_id, status\nFROM   orders\nWHERE  order_id = 1;  -- reads 'CONFIRMED'" },
      { comment: 'Restaurant sets status to Preparing', sql: "UPDATE orders\nSET    status = 'PREPARING'\nWHERE  order_id = 1;" },
      { comment: 'T1 commits', sql: 'COMMIT;' },
    ],
    t2Steps: [
      { comment: 'T2 begins', sql: 'START TRANSACTION;' },
      { comment: "⚠️ Reads 'CONFIRMED' — T1 hasn't committed yet", sql: "SELECT order_id, status\nFROM   orders\nWHERE  order_id = 1;  -- still sees 'CONFIRMED'" },
      { comment: "⚠️ Overwrites PREPARING with CANCELLED (Lost Update)", sql: "UPDATE orders\nSET    status = 'CANCELLED'\nWHERE  order_id = 1;" },
      { comment: 'T2 commits → PREPARING is gone', sql: 'COMMIT;' },
    ],
  },
  {
    id: 3,
    emoji: '🛵',
    title: 'Delivery Partner Assignment Conflict',
    subtitle: 'Two orders race to grab the same available delivery partner',
    color: '#8b5cf6',
    conflictType: 'Resource Double-Booking / Race Condition',
    table: 'delivery_partner (is_available), deliveries',
    description:
      'Only one delivery partner is free. Two orders are dispatched at the same time. Both transactions read is_available=1, both try to INSERT into deliveries and mark the partner Busy — resulting in one partner assigned to two orders simultaneously.',
    t1Label: 'Order #1 Dispatch',
    t2Label: 'Order #2 Dispatch',
    conflictLine: "T2 reads is_available=1 (T1 not yet committed). Both transactions proceed. After T1 commits and T2 commits, the same partner has two active deliveries — a Double-Booking.",
    t1Steps: [
      { comment: 'T1 begins', sql: 'START TRANSACTION;' },
      { comment: 'T1 finds an available partner', sql: "SELECT dp_id, full_name, is_available\nFROM   delivery_partner\nWHERE  is_available = 1\nLIMIT  1;\n-- Returns dp_id = 1" },
      { comment: 'T1 assigns partner to Order #1', sql: "INSERT INTO deliveries (order_id, dp_id, status)\nVALUES (1, 1, 'ASSIGNED');" },
      { comment: 'T1 sets partner as Busy', sql: "UPDATE delivery_partner\nSET    is_available = 0\nWHERE  dp_id = 1;" },
      { comment: 'T1 commits → partner is Busy', sql: 'COMMIT;' },
    ],
    t2Steps: [
      { comment: 'T2 begins', sql: 'START TRANSACTION;' },
      { comment: '⚠️ CONFLICT: Reads is_available=1 (T1 not committed yet!)', sql: "SELECT dp_id, full_name, is_available\nFROM   delivery_partner\nWHERE  is_available = 1\nLIMIT  1;\n-- Still returns dp_id = 1!" },
      { comment: '⚠️ Tries to assign the same partner to Order #2', sql: "INSERT INTO deliveries (order_id, dp_id, status)\nVALUES (2, 1, 'ASSIGNED');  -- DOUBLE BOOKING!" },
      { comment: 'App detects conflict → ROLLBACK', sql: 'ROLLBACK;  -- Order #2 must wait for another partner' },
    ],
  },
];

function ScenarioCard({ s }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      key={s.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: s.id * 0.08 }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${s.color}33`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px',
          cursor: 'pointer', borderBottom: open ? `1px solid ${s.color}22` : 'none',
          background: `linear-gradient(135deg, ${s.color}0d, transparent)`,
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
          {s.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Scenario {s.id}: {s.title}</span>
            <span style={{ background: `${s.color}22`, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
              {s.conflictType}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginTop: 4 }}>{s.subtitle}</div>
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 24 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>{s.description}</p>

            {/* Conflict callout */}
            <div style={{ background: `${s.color}11`, border: `1px solid ${s.color}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.85rem', lineHeight: 1.6 }}>
              <strong style={{ color: s.color }}>⚠️ Concurrency Conflict: </strong>{s.conflictLine}
            </div>

            {/* Affected table tag */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Affected Table: </span>
              <code style={{ background: 'var(--bg-2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.82rem' }}>{s.table}</code>
            </div>

            {/* T1 / T2 side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { steps: s.t1Steps, label: `Transaction 1 — ${s.t1Label}`, color: '#3b82f6' },
                { steps: s.t2Steps, label: `Transaction 2 — ${s.t2Label}`, color: '#ef4444' },
              ].map(({ steps, label, color }) => (
                <div key={label} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    {label}
                  </div>
                  {steps.map((step, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', color: step.comment.startsWith('⚠️') ? '#f59e0b' : 'var(--text-muted)', marginBottom: 5, fontStyle: 'italic' }}>
                        {step.comment}
                      </div>
                      <pre style={{
                        margin: 0, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8,
                        fontSize: '0.78rem', color: 'var(--text)', overflowX: 'auto', lineHeight: 1.5,
                        border: step.comment.startsWith('⚠️') ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
                      }}>
                        {step.sql}
                      </pre>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminTransactions() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔀 Transaction Scenarios</h1>
        <p className="page-subtitle">Concurrent transaction demos — click a scenario to expand it</p>
      </div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 28,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}
      >
        <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>ℹ️</div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>How to demo these transactions</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.6 }}>
            Open <code style={{ background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 4 }}>db/transactions.sql</code> in MySQL Workbench.
            Expand each scenario below to see the SQL for Transaction 1 and Transaction 2.
            Open <strong>two separate session tabs</strong>, paste the respective steps, and execute them interleaved to observe blocking, race conditions, and rollback behaviour.
          </div>
        </div>
      </motion.div>

      {/* Scenario cards */}
      {SCENARIOS.map(s => <ScenarioCard key={s.id} s={s} />)}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <span><span style={{ color: '#3b82f6', fontWeight: 700 }}>● Transaction 1</span> — first concurrent session</span>
        <span><span style={{ color: '#ef4444', fontWeight: 700 }}>● Transaction 2</span> — second concurrent session</span>
        <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠️</span> — marks the conflict point</span>
      </div>
    </div>
  );
}
