const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { MESSAGES, sendNotification } = require('../utils/notifications');

// PUT /api/delivery/availability
router.put('/availability', authMiddleware, async (req, res) => {
  const { is_available } = req.body;
  try {
    await db.query('UPDATE delivery_partner SET is_available = ? WHERE auth_id = ?', [is_available ? 1 : 0, req.user.auth_id]);
    res.json({ message: 'Availability updated', is_available });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/delivery/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    if (!rows.length) return res.status(404).json({ message: 'Delivery partner not found' });
    const dp = rows[0];
    const [countRows] = await db.query('SELECT COUNT(*) as total FROM commission WHERE dp_id = ?', [dp.dp_id]);
    dp.total_deliveries = countRows[0]?.total || 0;
    res.json(dp);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/delivery/profile — update name, phone, vehicle_type, city
router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, phone_no, vehicle_type, city } = req.body;
  try {
    await db.query(
      'UPDATE delivery_partner SET full_name = ?, phone_no = ?, vehicle_type = ?, city = ? WHERE auth_id = ?',
      [full_name, phone_no, vehicle_type || null, city || null, req.user.auth_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/delivery/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [authRows] = await db.query('SELECT * FROM auth WHERE auth_id = ?', [req.user.auth_id]);
    if (!authRows.length) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(current_password, authRows[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE auth SET password_hash = ? WHERE auth_id = ?', [hash, req.user.auth_id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/delivery/available-orders — READY_FOR_PICKUP orders in the dp's city (manual assignment)
router.get('/available-orders', authMiddleware, async (req, res) => {
  try {
    const [dpRows] = await db.query('SELECT * FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    if (!dpRows.length) return res.status(404).json({ message: 'Delivery partner not found' });
    const dp = dpRows[0];
    // Only show orders from restaurants in the same city as the DP
    // and that are NOT already assigned to any delivery
    let query = `
      SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.city as restaurant_city,
             c.full_name as customer_name, c.phone_no as customer_phone
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id AND d.status IN ('ASSIGNED','PICKED_UP')
      WHERE o.status = 'READY_FOR_PICKUP'
        AND d.delivery_id IS NULL`;
    const params = [];
    if (dp.city) { query += ' AND r.city = ?'; params.push(dp.city); }
    query += ' ORDER BY o.created_at ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/delivery/accept/:orderId — delivery partner manually accepts an order
// TRANSACTION — Scenario 3: Delivery Partner Assignment Conflict
//
// Two orders may try to assign the same (last available) delivery partner.
// We lock the DP row with SELECT ... FOR UPDATE inside a transaction.
// If T2 runs its SELECT while T1 holds the lock, T2 blocks until T1 commits.
// After T1 commits (is_available = 0), T2 unblocks and sees is_available = 0 → ROLLBACK.
router.post('/accept/:orderId', authMiddleware, requireRole('DELIVERY_PARTNER'), async (req, res) => {
  const { orderId } = req.params;
  const conn = await db.getConnection();
  try {
    // ── START TRANSACTION ──
    await conn.beginTransaction();

    const [dpRows] = await conn.query('SELECT dp_id, is_available FROM delivery_partner WHERE auth_id = ? FOR UPDATE', [req.user.auth_id]);
    if (!dpRows.length) { 
        await conn.rollback();
        conn.release(); 
        return res.status(404).json({ message: 'Delivery partner not found' }); 
    }
    const dp = dpRows[0];
    if (!dp.is_available) { conn.release(); return res.status(400).json({ message: 'You must be available to accept orders. Go online first.' }); }

    // Check order still exists and is READY_FOR_PICKUP (plain read — outside tx)
    const [orderRows] = await conn.query(
      `SELECT o.*, r.name as rname, r.city as rcity, r.address as raddress
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.order_id = ? AND o.status = 'READY_FOR_PICKUP'`,
      [req.params.orderId]
    );
    if (!orderRows.length) { conn.release(); return res.status(400).json({ message: 'Order is no longer available for pickup.' }); }
    const order = orderRows[0];

    if (dp.city && order.rcity && dp.city.toLowerCase() !== order.rcity.toLowerCase()) {
      conn.release();
      return res.status(400).json({ message: `You can only accept orders in ${dp.city}.` });
    }

    // ── START TRANSACTION ──
    await conn.beginTransaction();

    // Lock the delivery partner row — if another order is concurrently trying to assign
    // this same DP, one of the two transactions will BLOCK here
    // ⚠️ CONFLICT POINT: after T1 commits (is_available=0), T2 unblocks and reads is_available=0
    const [lockedDp] = await conn.query(
      'SELECT dp_id, is_available FROM delivery_partner WHERE dp_id = ? FOR UPDATE',
      [dp.dp_id]
    );
    if (!lockedDp[0].is_available) {
      // ── ROLLBACK ── partner was grabbed by the concurrently committed transaction
      await conn.rollback(); conn.release();
      return res.status(400).json({ message: 'This delivery partner just became unavailable. Please refresh and try again.' });
    }

    // Check the order has not already been assigned (double-check inside transaction)
    const [existing] = await conn.query(
      "SELECT delivery_id FROM deliveries WHERE order_id = ? AND status IN ('ASSIGNED','PICKED_UP')",
      [req.params.orderId]
    );
    if (existing.length) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ message: 'This order was already accepted by another partner.' });
    }

    // Assign the order
    const [result] = await conn.query(
      'INSERT INTO deliveries (order_id, dp_id, status) VALUES (?, ?, ?)',
      [req.params.orderId, dp.dp_id, 'ASSIGNED']
    );
    // Mark partner as busy atomically in the same transaction
    await conn.query('UPDATE delivery_partner SET is_available = 0 WHERE dp_id = ?', [dp.dp_id]);

    // ── COMMIT ── order assigned and DP marked busy atomically
    await conn.commit();

    // Notifications outside transaction
    await sendNotification(db, 'CUSTOMER', order.customer_id,
      MESSAGES.DP_ASSIGNED(req.params.orderId, order.rname, order.customer_address));

    res.status(201).json({ message: 'Order accepted!', delivery_id: result.insertId });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/delivery/current — active delivery
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const [dpRows] = await db.query('SELECT dp_id FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    if (!dpRows.length) return res.status(404).json({ message: 'Delivery partner not found' });
    const [rows] = await db.query(
      `SELECT d.*, o.customer_address, o.total_amount, o.status as order_status,
              r.name as restaurant_name, r.address as restaurant_address,
              c.full_name as customer_name, c.phone_no as customer_phone
       FROM deliveries d
       JOIN orders o ON d.order_id = o.order_id
       JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN customer c ON o.customer_id = c.customer_id
       WHERE d.dp_id = ? AND d.status IN ('ASSIGNED','PICKED_UP') LIMIT 1`,
      [dpRows[0].dp_id]
    );
    res.json(rows[0] || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/delivery/assignments — history
router.get('/assignments', authMiddleware, async (req, res) => {
  try {
    const [dpRows] = await db.query('SELECT dp_id FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    if (!dpRows.length) return res.status(404).json({ message: 'Delivery partner not found' });
    const [rows] = await db.query(
      `SELECT d.*, o.customer_address, o.total_amount, o.status as order_status,
              r.name as restaurant_name, r.address as restaurant_address,
              c.full_name as customer_name, c.phone_no as customer_phone
       FROM deliveries d
       JOIN orders o ON d.order_id = o.order_id
       JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN customer c ON o.customer_id = c.customer_id
       WHERE d.dp_id = ? ORDER BY d.created_at DESC`,
      [dpRows[0].dp_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/delivery/:deliveryId/status — update delivery status (PICKED_UP | DELIVERED)
router.put('/:deliveryId/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['PICKED_UP', 'DELIVERED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    const [deliveryRows] = await db.query('SELECT * FROM deliveries WHERE delivery_id = ?', [req.params.deliveryId]);
    if (!deliveryRows.length) return res.status(404).json({ message: 'Delivery not found' });
    const delivery = deliveryRows[0];

    await db.query('UPDATE deliveries SET status = ? WHERE delivery_id = ?', [status, req.params.deliveryId]);

    if (status === 'PICKED_UP') {
      await db.query('UPDATE orders SET status = ? WHERE order_id = ?', ['OUT_FOR_DELIVERY', delivery.order_id]);
      const [orderRows] = await db.query('SELECT customer_id FROM orders WHERE order_id = ?', [delivery.order_id]);
      if (orderRows.length) {
        await sendNotification(db, 'CUSTOMER', orderRows[0].customer_id, MESSAGES.ORDER_PICKED_UP(delivery.order_id));
      }
    }

    if (status === 'DELIVERED') {
      await db.query('UPDATE orders SET status = ? WHERE order_id = ?', ['DELIVERED', delivery.order_id]);
      await db.query('UPDATE delivery_partner SET is_available = 1 WHERE dp_id = ?', [delivery.dp_id]);
      const [orderRows] = await db.query('SELECT * FROM orders WHERE order_id = ?', [delivery.order_id]);
      if (orderRows.length) {
        const order = orderRows[0];
        const delivery_commission = order.delivery_charges || 30;
        const restaurant_commission = order.total_amount * 0.10;
        const platform_profit = order.total_amount * 0.05;
        await db.query(
          'INSERT INTO commission (order_id, dp_id, restaurant_id, delivery_commission_amount, restaurant_commission_amount, platform_profit) VALUES (?, ?, ?, ?, ?, ?)',
          [delivery.order_id, delivery.dp_id, order.restaurant_id, delivery_commission, restaurant_commission, platform_profit]
        );
        await sendNotification(db, 'CUSTOMER', order.customer_id, MESSAGES.ORDER_DELIVERED(delivery.order_id));
        await sendNotification(db, 'DELIVERY_PARTNER', delivery.dp_id, MESSAGES.DP_DELIVERED_DONE(delivery.order_id, delivery_commission));
      }
    }
    res.json({ message: 'Delivery status updated', status });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/delivery/earnings
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const [dpRows] = await db.query('SELECT dp_id FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    if (!dpRows.length) return res.status(404).json({ message: 'Delivery partner not found' });
    const [rows] = await db.query(
      'SELECT SUM(delivery_commission_amount) as total_earnings, COUNT(*) as total_deliveries FROM commission WHERE dp_id = ?',
      [dpRows[0].dp_id]
    );
    const [recent] = await db.query(
      `SELECT c.*, o.created_at as order_date FROM commission c 
       JOIN orders o ON c.order_id = o.order_id WHERE c.dp_id = ? ORDER BY o.created_at DESC LIMIT 10`,
      [dpRows[0].dp_id]
    );
    res.json({ summary: rows[0], recent });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/delivery/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const [dpRows] = await db.query('SELECT dp_id FROM delivery_partner WHERE auth_id = ?', [req.user.auth_id]);
    const [rows] = await db.query(
      'SELECT * FROM notification WHERE receiver_role = ? AND receiver_id = ? ORDER BY created_at DESC',
      ['DELIVERY_PARTNER', dpRows[0]?.dp_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
