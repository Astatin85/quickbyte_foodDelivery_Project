const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', authMiddleware, async (req, res) => {
  const { role } = req.query;
  try {
    let users = [];
    if (!role || role === 'CUSTOMER') {
      const [rows] = await db.query(`SELECT c.*, a.role, a.auth_id, a.is_active FROM customer c JOIN auth a ON c.auth_id = a.auth_id`);
      users = users.concat(rows.map(r => ({ ...r, user_type: 'CUSTOMER' })));
    }
    if (!role || role === 'RESTAURANT_OWNER') {
      const [rows] = await db.query(`SELECT ro.*, a.role, a.auth_id, a.is_active FROM restaurant_owner ro JOIN auth a ON ro.auth_id = a.auth_id`);
      users = users.concat(rows.map(r => ({ ...r, user_type: 'RESTAURANT_OWNER' })));
    }
    if (!role || role === 'DELIVERY_PARTNER') {
      const [rows] = await db.query(`SELECT dp.*, a.role, a.auth_id, a.is_active FROM delivery_partner dp JOIN auth a ON dp.auth_id = a.auth_id`);
      users = users.concat(rows.map(r => ({ ...r, user_type: 'DELIVERY_PARTNER' })));
    }
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/users/:authId/status
router.put('/users/:authId/status', authMiddleware, async (req, res) => {
  const { is_active } = req.body;
  try {
    await db.query('UPDATE auth SET is_active = ? WHERE auth_id = ?', [is_active ? 1 : 0, req.params.authId]);
    res.json({ message: 'User status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/restaurants
router.get('/restaurants', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT r.*, ro.full_name as owner_name, ro.phone_no as owner_phone
                                   FROM restaurants r
                                   JOIN restaurant_owner ro ON r.owner_id = ro.owner_id ORDER BY r.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/restaurants/:id/approve
router.put('/restaurants/:id/approve', authMiddleware, async (req, res) => {
  const { is_approved } = req.body;
  try {
    await db.query('UPDATE restaurants SET is_approved = ? WHERE restaurant_id = ?', [is_approved ? 1 : 0, req.params.id]);
    res.json({ message: 'Restaurant status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/orders
router.get('/orders', authMiddleware, async (req, res) => {
  const { status } = req.query;
  let query = `SELECT o.*, r.name as restaurant_name, c.full_name as customer_name
               FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
               JOIN customer c ON o.customer_id = c.customer_id`;
  const params = [];
  if (status) { query += ' WHERE o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC';
  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/commissions
router.get('/commissions', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, o.total_amount, r.name as restaurant_name, dp.full_name as partner_name
      FROM commission c
      JOIN orders o ON c.order_id = o.order_id
      LEFT JOIN restaurants r ON c.restaurant_id = r.restaurant_id
      LEFT JOIN delivery_partner dp ON c.dp_id = dp.dp_id
      ORDER BY c.commission_id DESC`);
    const [summary] = await db.query(`
      SELECT SUM(delivery_commission_amount) as total_delivery, 
             SUM(restaurant_commission_amount) as total_restaurant,
             SUM(platform_profit) as total_profit
      FROM commission`);
    res.json({ commissions: rows, summary: summary[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/notifications - Send notification
router.post('/notifications', authMiddleware, async (req, res) => {
  const { receiver_role, receiver_id, message } = req.body;
  try {
    await db.query(
      'INSERT INTO notification (receiver_role, receiver_id, message) VALUES (?, ?, ?)',
      [receiver_role, receiver_id, message]
    );
    res.status(201).json({ message: 'Notification sent' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notification ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const [[{ total_orders }]] = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    const [[{ total_customers }]] = await db.query('SELECT COUNT(*) as total_customers FROM customer');
    const [[{ total_restaurants }]] = await db.query('SELECT COUNT(*) as total_restaurants FROM restaurants');
    const [[{ total_revenue }]] = await db.query('SELECT SUM(amount) as total_revenue FROM payment WHERE status = "COMPLETED"');
    const [[{ total_partners }]] = await db.query('SELECT COUNT(*) as total_partners FROM delivery_partner');
    const [recent_orders] = await db.query(
      `SELECT o.*, r.name as restaurant_name, c.full_name as customer_name 
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       JOIN customer c ON o.customer_id = c.customer_id ORDER BY o.created_at DESC LIMIT 5`
    );
    res.json({ total_orders, total_customers, total_restaurants, total_revenue: total_revenue || 0, total_partners, recent_orders });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
