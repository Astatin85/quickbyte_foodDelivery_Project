const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { MESSAGES, sendNotification } = require('../utils/notifications');

// POST /api/restaurant/register - Register restaurant
router.post('/register', authMiddleware, async (req, res) => {
  const { name, cuisine_type, address, city, phone, minimum_order_amount, description } = req.body;
  try {
    const [ownerRows] = await db.query('SELECT owner_id FROM restaurant_owner WHERE auth_id = ?', [req.user.auth_id]);
    if (!ownerRows.length) return res.status(404).json({ message: 'Owner not found' });
    const owner_id = ownerRows[0].owner_id;
    const [result] = await db.query(
      'INSERT INTO restaurants (owner_id, name, cuisine_type, address, city, phone, minimum_order_amount, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [owner_id, name, cuisine_type, address, city, phone, minimum_order_amount || 0, description || null]
    );
    res.status(201).json({ message: 'Restaurant registered', restaurant_id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/my - Get owner's restaurant(s)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [ownerRows] = await db.query('SELECT owner_id FROM restaurant_owner WHERE auth_id = ?', [req.user.auth_id]);
    if (!ownerRows.length) return res.status(404).json({ message: 'Owner not found' });
    const [rows] = await db.query('SELECT * FROM restaurants WHERE owner_id = ?', [ownerRows[0].owner_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/profile - Get owner profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM restaurant_owner WHERE auth_id = ?', [req.user.auth_id]);
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurant/profile - Update owner profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, phone_no } = req.body;
  try {
    await db.query('UPDATE restaurant_owner SET full_name=?, phone_no=? WHERE auth_id=?', [full_name, phone_no, req.user.auth_id]);
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurant/change-password
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

// PUT /api/restaurant/:id/toggle-open - Go online / offline
router.put('/:id/toggle-open', authMiddleware, async (req, res) => {
  const { is_open } = req.body;
  try {
    await db.query('UPDATE restaurants SET is_open = ? WHERE restaurant_id = ?', [is_open ? 1 : 0, req.params.id]);
    res.json({ message: is_open ? 'Restaurant is now Online' : 'Restaurant is now Offline', is_open });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurant/:id - Update restaurant details
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, cuisine_type, address, city, phone, minimum_order_amount, description } = req.body;
  try {
    await db.query(
      'UPDATE restaurants SET name=?, cuisine_type=?, address=?, city=?, phone=?, minimum_order_amount=?, description=? WHERE restaurant_id=?',
      [name, cuisine_type, address, city, phone, minimum_order_amount, description || null, req.params.id]
    );
    res.json({ message: 'Restaurant updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/menu/:id - Get all menu items (owner view)
router.get('/menu/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/restaurant/:id/menu - Add menu item
router.post('/:id/menu', authMiddleware, async (req, res) => {
  const { name, price, is_vegetarian, preparation_time, description, quantity } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO menu_items (restaurant_id, name, price, is_vegetarian, preparation_time, description, availability_quantity, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [req.params.id, name, price, is_vegetarian ? 1 : 0, preparation_time || 20, description || null, quantity || 100]
    );
    res.status(201).json({ message: 'Menu item added', item_id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurant/menu/:itemId - Update menu item
router.put('/menu/:itemId', authMiddleware, async (req, res) => {
  const { name, price, is_vegetarian, preparation_time, description, quantity, is_available } = req.body;
  try {
    await db.query(
      'UPDATE menu_items SET name=?, price=?, is_vegetarian=?, preparation_time=?, description=?, availability_quantity=?, is_available=? WHERE item_id=?',
      [name, price, is_vegetarian ? 1 : 0, preparation_time, description, quantity, is_available ? 1 : 0, req.params.itemId]
    );
    res.json({ message: 'Menu item updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/restaurant/menu/:itemId - Delete menu item
router.delete('/menu/:itemId', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM menu_items WHERE item_id = ?', [req.params.itemId]);
    res.json({ message: 'Menu item deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/:id/orders - Get orders for restaurant
router.get('/:id/orders', authMiddleware, async (req, res) => {
  const { status } = req.query;
  let query = `SELECT o.*, c.full_name as customer_name, c.phone_no as customer_phone 
               FROM orders o
               JOIN customer c ON o.customer_id = c.customer_id
               WHERE o.restaurant_id = ?`;
  const params = [req.params.id];
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC';
  try {
    const [rows] = await db.query(query, params);
    for (let order of rows) {
      const [items] = await db.query(
        'SELECT oi.*, m.name as item_name FROM order_items oi JOIN menu_items m ON oi.item_id = m.item_id WHERE oi.order_id = ?',
        [order.order_id]
      );
      order.items = items;
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurant/orders/:orderId/status - Update order status with full notification chain
router.put('/orders/:orderId/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  try {
    await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.orderId]);

    // Fetch order details for notifications
    const [orderRows] = await db.query(
      `SELECT o.*, c.customer_id, c.full_name as customer_name, r.name as restaurant_name, r.owner_id
       FROM orders o
       JOIN customer c ON o.customer_id = c.customer_id
       JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.order_id = ?`,
      [req.params.orderId]
    );
    if (!orderRows.length) return res.status(404).json({ message: 'Order not found' });
    const order = orderRows[0];

    // ---- Notify CUSTOMER based on new status ----
    if (status === 'CONFIRMED') {
      await sendNotification(db, 'CUSTOMER', order.customer_id,
        MESSAGES.ORDER_CONFIRMED(req.params.orderId, order.restaurant_name));

    } else if (status === 'PREPARING') {
      await sendNotification(db, 'CUSTOMER', order.customer_id,
        MESSAGES.ORDER_PREPARING(req.params.orderId, order.restaurant_name));

    } else if (status === 'READY_FOR_PICKUP') {
      await sendNotification(db, 'CUSTOMER', order.customer_id,
        MESSAGES.ORDER_READY(req.params.orderId, order.restaurant_name));
      // No auto-assign — delivery partners manually pick up available orders

    } else if (status === 'CANCELLED') {
      await sendNotification(db, 'CUSTOMER', order.customer_id,
        MESSAGES.ORDER_CANCELLED(req.params.orderId));
    }

    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/:id/stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const [totalOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?', [req.params.id]);
    const [revenue] = await db.query('SELECT SUM(total_amount) as total FROM orders WHERE restaurant_id = ? AND status = "DELIVERED"', [req.params.id]);
    const [avgRating] = await db.query('SELECT avg_rating, total_reviews FROM restaurants WHERE restaurant_id = ?', [req.params.id]);
    res.json({
      total_orders: totalOrders[0].count,
      revenue: revenue[0].total || 0,
      avg_rating: avgRating[0]?.avg_rating || 0,
      total_reviews: avgRating[0]?.total_reviews || 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/:id - Get restaurant details (keep at bottom to avoid route conflicts)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE restaurant_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurant/:id/menu - Get all menu items (public)
router.get('/:id/menu', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
