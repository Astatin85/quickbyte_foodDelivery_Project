const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { auth_id, password, role, full_name, email } = req.body;
  if (!auth_id || !password || !role || !full_name) {
    return res.status(400).json({ message: 'auth_id (mobile), password, role, and full_name are required' });
  }
  const validRoles = ['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query('SELECT auth_id FROM auth WHERE auth_id = ?', [auth_id]);
    if (existing.length > 0) {
      conn.release();
      return res.status(409).json({ message: 'Mobile number already registered' });
    }

    await conn.beginTransaction();

    const password_hash = await bcrypt.hash(password, 10);
    await conn.query('INSERT INTO auth (auth_id, password_hash, role) VALUES (?, ?, ?)', [auth_id, password_hash, role]);

    if (role === 'CUSTOMER') {
      await conn.query('INSERT INTO customer (auth_id, full_name, phone_no, address) VALUES (?, ?, ?, ?)', [auth_id, full_name, auth_id, '']);
    } else if (role === 'RESTAURANT_OWNER') {
      await conn.query('INSERT INTO restaurant_owner (auth_id, full_name, phone_no) VALUES (?, ?, ?)', [auth_id, full_name, auth_id]);
    } else if (role === 'DELIVERY_PARTNER') {
      await conn.query('INSERT INTO delivery_partner (auth_id, full_name, phone_no) VALUES (?, ?, ?)', [auth_id, full_name, auth_id]);
    } else if (role === 'ADMIN') {
      await conn.query('INSERT INTO admin (auth_id, full_name) VALUES (?, ?)', [auth_id, full_name]);
    }

    await conn.commit();
    conn.release();

    const token = jwt.sign({ auth_id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registered successfully', token, role, auth_id });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { auth_id, password } = req.body;

  if (!auth_id || !password) {
    return res.status(400).json({ message: 'auth_id and password required' });
  }

  try {
    // 🔥 Step 1: Fetch user
    const [rows] = await db.query(
      'SELECT * FROM auth WHERE auth_id = ?',
      [auth_id]
    );

    console.log("ROWS:", rows);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    console.log("DB HASH:", user.password_hash);

    // 🔥 Step 2: Compare password
    const match = await bcrypt.compare(password, user.password_hash);

    console.log("MATCH RESULT:", match);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🔥 Step 3: Continue as before
    let profileData = {};

    if (user.role === 'CUSTOMER') {
      const [p] = await db.query('SELECT * FROM customer WHERE auth_id = ?', [auth_id]);
      profileData = p[0] || {};
    } else if (user.role === 'RESTAURANT_OWNER') {
      const [p] = await db.query('SELECT * FROM restaurant_owner WHERE auth_id = ?', [auth_id]);
      profileData = p[0] || {};
    } else if (user.role === 'DELIVERY_PARTNER') {
      const [p] = await db.query('SELECT * FROM delivery_partner WHERE auth_id = ?', [auth_id]);
      profileData = p[0] || {};
    } else if (user.role === 'ADMIN') {
      const [p] = await db.query('SELECT * FROM admin WHERE auth_id = ?', [auth_id]);
      profileData = p[0] || {};
    }

    const token = jwt.sign(
      { auth_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, auth_id, profile: profileData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ auth_id: decoded.auth_id, role: decoded.role });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
