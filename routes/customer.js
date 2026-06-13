const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const { authMiddleware } = require('../middleware/auth');
const { MESSAGES, sendNotification } = require('../utils/notifications');

// GET /api/customer/restaurants — filtered by customer's city + online + approved
router.get('/restaurants', authMiddleware, async (req, res) => {
  const { search, cuisine, min_rating } = req.query;
  try {
    // Get customer's city
    const [custRows] = await db.query('SELECT city FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    const customerCity = custRows[0]?.city || null;

    let query = `SELECT r.* FROM restaurants r WHERE r.is_approved = 1 AND r.is_open = 1`;
    const params = [];
    if (customerCity) { query += ' AND r.city = ?'; params.push(customerCity); }
    if (search) { query += ' AND r.name LIKE ?'; params.push(`%${search}%`); }
    if (cuisine) { query += ' AND r.cuisine_type = ?'; params.push(cuisine); }
    if (min_rating) { query += ' AND r.avg_rating >= ?'; params.push(parseFloat(min_rating)); }
    query += ' ORDER BY avg_rating DESC';
    const [rows] = await db.query(query, params);
    res.json({ restaurants: rows, city: customerCity });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/customer/restaurants/:id — single restaurant (public but still validated)
router.get('/restaurants/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE restaurant_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/customer/restaurants/:id/menu
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/customer/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/customer/profile — update name, phone, address, city
router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, phone_no, address, city } = req.body;
  try {
    await db.query(
      'UPDATE customer SET full_name = ?, phone_no = ?, address = ?, city = ? WHERE auth_id = ?',
      [full_name, phone_no, address || null, city || null, req.user.auth_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/customer/change-password
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

// ============================================================
// POST /api/customer/orders — place order
// TRANSACTION — Scenario 1: Stock Quantity Conflict
//
// Uses SELECT ... FOR UPDATE to lock each menu item row.
// If two customers order the same item simultaneously, the second
// transaction BLOCKS on the FOR UPDATE until the first commits.
// After unblocking it re-reads the reduced stock and if qty < needed
// it gets a clear error message and the order is ROLLED BACK.
// ============================================================
// POST /api/customer/orders — place order
router.post('/orders', authMiddleware, async (req, res) => {
  const { restaurant_id, items, customer_address, delivery_charges, total_amount } = req.body;

  const conn = await db.getConnection();
  try {
    console.log('[DEBUG] POST /orders called. req.user:', req.user);
    const [custRows] = await conn.query('SELECT * FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    console.log('[DEBUG] custRows:', custRows);
    
    if (!custRows.length) { 
      conn.release(); 
      return res.status(404).json({ message: 'Customer not found' }); 
    }
    const customer = custRows[0];

    const [restRows] = await conn.query('SELECT * FROM restaurants WHERE restaurant_id = ?', [restaurant_id]);
    if (!restRows.length) { conn.release(); return res.status(404).json({ message: 'Restaurant not found' }); }
    const restaurant = restRows[0];

    if (customer.city && restaurant.city && customer.city.toLowerCase() !== restaurant.city.toLowerCase()) {
      conn.release();
      return res.status(400).json({ message: `Sorry! You can only order from restaurants in ${customer.city}. This restaurant is in ${restaurant.city}.` });
    }
    if (!restaurant.is_open) { conn.release(); return res.status(400).json({ message: 'This restaurant is currently offline.' }); }

    // ── START TRANSACTION ──
    await conn.beginTransaction();

    // Lock each ordered item so concurrent transactions must wait for us to commit/rollback
    // This is where Scenario 1 conflict happens: T2 blocks here while T1 holds the lock
    for (const item of items) {
      const [stockRows] = await conn.query(
        'SELECT item_id, name, availability_quantity FROM menu_items WHERE item_id = ? AND restaurant_id = ? FOR UPDATE',
        [item.item_id, restaurant_id]
      );
      if (!stockRows.length) {
        // ── ROLLBACK ── item doesn't belong to this restaurant
        await conn.rollback(); conn.release();
        return res.status(400).json({ message: 'Menu item not found in this restaurant.' });
      }
      const stock = stockRows[0];
      // ⚠️ CONFLICT POINT: after T1 committed, T2 re-reads here and finds reduced stock
      if (stock.availability_quantity < item.quantity) {
        // ── ROLLBACK ── not enough stock
        await conn.rollback(); conn.release();
        return res.status(400).json({
          message: `"${stock.name}" only has ${stock.availability_quantity} unit(s) left (you requested ${item.quantity}). Please update your cart.`
        });
      }
    }

    // All stock checks passed — insert the order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, restaurant_id, status, delivery_charges, total_amount, customer_address) VALUES (?, ?, ?, ?, ?, ?)',
      [customer.customer_id, restaurant_id, 'PLACED', delivery_charges || 0, total_amount, customer_address]
    );
    const order_id = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, item_id, quantity, special_instruction) VALUES (?, ?, ?, ?)',
        [order_id, item.item_id, item.quantity, item.special_instruction || null]
      );
      // Decrement stock so the next concurrent transaction sees the correct reduced quantity
      const [updateResult] = await conn.query(
        `UPDATE menu_items 
         SET availability_quantity = availability_quantity - ? 
         WHERE item_id = ? AND availability_quantity >= ?`,
         [item.quantity, item.item_id, item.quantity]
        );

        if (updateResult.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Item went out of stock due to concurrent order. Please try again.' });
        }
    }

    // ── COMMIT ── stock decremented, order recorded atomically
    await conn.commit();

    // Notifications are outside the transaction (non-critical side effects)
    await sendNotification(db, 'CUSTOMER', customer.customer_id, MESSAGES.ORDER_PLACED(order_id, restaurant.name));
    await sendNotification(db, 'RESTAURANT_OWNER', restaurant.owner_id, MESSAGES.REST_NEW_ORDER(order_id, customer.full_name || 'a customer'));

    res.status(201).json({ message: 'Order placed', order_id });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/customer/orders
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const [custRows] = await db.query('SELECT customer_id FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    if (!custRows.length) return res.status(404).json({ message: 'Customer not found' });
    const [rows] = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.cuisine_type 
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id 
       WHERE o.customer_id = ? ORDER BY o.created_at DESC`,
      [custRows[0].customer_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/customer/orders/:id
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!orderRows.length) return res.status(404).json({ message: 'Order not found' });
    const [items] = await db.query(
      `SELECT oi.*, m.name as item_name, m.price FROM order_items oi JOIN menu_items m ON oi.item_id = m.item_id WHERE oi.order_id = ?`,
      [req.params.id]
    );
    const [deliveryRows] = await db.query(
      `SELECT d.*, dp.full_name as partner_name, dp.phone_no as partner_phone FROM deliveries d 
       LEFT JOIN delivery_partner dp ON d.dp_id = dp.dp_id WHERE d.order_id = ?`,
      [req.params.id]
    );
    const [ratingRows] = await db.query('SELECT * FROM rating WHERE order_id = ?', [req.params.id]);
    res.json({ ...orderRows[0], items, delivery: deliveryRows[0] || null, rating: ratingRows[0] || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ============================================================
// PUT /api/customer/orders/:id/cancel — customer cancels an order
// TRANSACTION — Scenario 2: Order Status Conflict
//
// Restaurant may concurrently be setting the same order to PREPARING.
// We lock the order row with FOR UPDATE, re-read its current status,
// and ROLLBACK the cancellation if the restaurant has already moved it
// past CONFIRMED (i.e., it's PREPARING / READY_FOR_PICKUP / etc.).
// ============================================================
router.put('/orders/:id/cancel', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [custRows] = await conn.query('SELECT customer_id FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    if (!custRows.length) { conn.release(); return res.status(404).json({ message: 'Customer not found' }); }

    // ── START TRANSACTION ──
    await conn.beginTransaction();

    // Lock the order row — if the restaurant is concurrently updating status, one of us will block
    // ⚠️ CONFLICT POINT: this is where Scenario 2 conflict happens
    const [orderRows] = await conn.query(
      'SELECT order_id, status, customer_id FROM orders WHERE order_id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!orderRows.length) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orderRows[0];

    if (order.customer_id !== custRows[0].customer_id) {
      await conn.rollback(); conn.release();
      return res.status(403).json({ message: 'Not your order' });
    }

    // ⚠️ STATUS CHECK: restaurant may have already moved order to PREPARING or beyond
    const cancellableStatuses = ['PLACED', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      // ── ROLLBACK ── too late to cancel
      await conn.rollback(); conn.release();
      return res.status(400).json({
        message: `Cannot cancel — order is already "${order.status}". Contact the restaurant.`
      });
    }

    await conn.query("UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?", [req.params.id]);

    // ── COMMIT ──
    await conn.commit();

    await sendNotification(db, 'CUSTOMER', order.customer_id, MESSAGES.ORDER_CANCELLED(req.params.id));
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/customer/payments
router.post('/payments', authMiddleware, async (req, res) => {
  const { order_id, amount, payment_method } = req.body;
  try {
    const [custRows] = await db.query('SELECT customer_id FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    const customer_id = custRows[0].customer_id;
    const [result] = await db.query(
      'INSERT INTO payment (order_id, customer_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [order_id, customer_id, amount, payment_method, 'COMPLETED']
    );
    // Auto-confirm after payment
    await db.query('UPDATE orders SET status = ? WHERE order_id = ?', ['CONFIRMED', order_id]);
    // Notify customer of payment + confirmation
    const [orderInfo] = await db.query('SELECT r.name, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id WHERE o.order_id = ?', [order_id]);
    if (orderInfo.length) {
      await sendNotification(db, 'CUSTOMER', customer_id, MESSAGES.ORDER_CONFIRMED(order_id, orderInfo[0].name));
    }
    res.status(201).json({ message: 'Payment successful', payment_id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/customer/ratings
router.post('/ratings', authMiddleware, async (req, res) => {
  const { order_id, restaurant_rating, delivery_rating, restaurant_review, delivery_review } = req.body;
  try {
    // Insert rating — DB triggers will auto-update avg_rating on restaurants and delivery_partner
    await db.query(
      'INSERT INTO rating (order_id, restaurant_rating, delivery_rating, restaurant_review, delivery_review) VALUES (?, ?, ?, ?, ?)',
      [order_id, restaurant_rating, delivery_rating, restaurant_review || null, delivery_review || null]
    );

    // Load order info to send notifications
    const [orderRows] = await db.query(
      `SELECT o.restaurant_id, r.owner_id, r.name as rest_name
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.restaurant_id
       WHERE o.order_id = ?`,
      [order_id]
    );
    const [deliveryRows] = await db.query(
      `SELECT dp_id FROM deliveries WHERE order_id = ? LIMIT 1`, [order_id]
    );

    if (orderRows.length) {
      const { owner_id, rest_name } = orderRows[0];
      const reviewText = restaurant_review ? ` | "${restaurant_review}"` : '';
      await sendNotification(db, 'RESTAURANT_OWNER', owner_id,
        `⭐ New review for "${rest_name}" — Rating: ${'⭐'.repeat(restaurant_rating)} (${restaurant_rating}/5)${reviewText}`
      );
    }

    if (deliveryRows.length) {
      const { dp_id } = deliveryRows[0];
      const dpReviewText = delivery_review ? ` | "${delivery_review}"` : '';
      await sendNotification(db, 'DELIVERY_PARTNER', dp_id,
        `⭐ You received a delivery rating: ${'⭐'.repeat(delivery_rating)} (${delivery_rating}/5)${dpReviewText}`
      );
    }

    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// GET /api/customer/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const [custRows] = await db.query('SELECT customer_id FROM customer WHERE auth_id = ?', [req.user.auth_id]);
    const [rows] = await db.query(
      'SELECT * FROM notification WHERE receiver_role = ? AND receiver_id = ? ORDER BY created_at DESC',
      ['CUSTOMER', custRows[0]?.customer_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
