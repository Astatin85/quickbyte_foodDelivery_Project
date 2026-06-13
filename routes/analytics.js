const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

// 1. Restaurants with above average rating
router.get('/above-avg-rating', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT name, avg_rating FROM Restaurants
      WHERE avg_rating > (SELECT AVG(avg_rating) FROM Restaurants)
      ORDER BY avg_rating DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Customers who ordered from more than 3 restaurants
router.get('/multi-restaurant-customers', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.customer_id, c.full_name, COUNT(DISTINCT o.restaurant_id) AS restaurants_visited
      FROM Customer c JOIN Orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id, c.full_name
      HAVING COUNT(DISTINCT o.restaurant_id) > 3`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Restaurant with highest revenue
router.get('/highest-revenue-restaurant', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.restaurant_id, r.name, SUM(o.total_amount) AS revenue
      FROM Restaurants r JOIN Orders o ON r.restaurant_id = o.restaurant_id
      GROUP BY r.restaurant_id, r.name
      HAVING revenue = (
        SELECT MAX(total_rev) FROM (
          SELECT SUM(total_amount) AS total_rev FROM Orders GROUP BY restaurant_id
        ) t
      )`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Customers who never placed an order
router.get('/never-ordered-customers', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.customer_id, c.full_name FROM Customer c
      WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.customer_id = c.customer_id)`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. Delivery partner with highest average rating
router.get('/top-delivery-partner', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dp.dp_id, dp.full_name, dp.avg_rating FROM Delivery_Partner dp
      WHERE dp.avg_rating = (SELECT MAX(avg_rating) FROM Delivery_Partner)`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 6. Most ordered menu item per restaurant
router.get('/most-ordered-items', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.restaurant_id, m.name, SUM(oi.quantity) AS total_orders
      FROM Menu_Items m JOIN Order_Items oi ON m.item_id = oi.item_id
      GROUP BY m.restaurant_id, m.name ORDER BY total_orders DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 7. Customers who spent more than average customer spending
router.get('/high-spending-customers', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.customer_id, c.full_name, SUM(o.total_amount) AS total_spent
      FROM Customer c JOIN Orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id, c.full_name
      HAVING SUM(o.total_amount) > (
        SELECT AVG(customer_total) FROM (
          SELECT SUM(total_amount) AS customer_total FROM Orders GROUP BY customer_id
        ) t
      ) ORDER BY total_spent DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 8. Restaurants that have never received ratings
router.get('/never-rated-restaurants', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.restaurant_id, r.name FROM Restaurants r
      LEFT JOIN Orders o ON r.restaurant_id = o.restaurant_id
      LEFT JOIN Rating ra ON o.order_id = ra.order_id
      WHERE ra.order_id IS NULL`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 9. Delivery partners who delivered more than 10 orders
router.get('/top-delivery-partners-count', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dp.dp_id, dp.full_name, COUNT(d.delivery_id) AS deliveries
      FROM Delivery_Partner dp JOIN Deliveries d ON dp.dp_id = d.dp_id
      WHERE d.status = 'DELIVERED'
      GROUP BY dp.dp_id, dp.full_name
      HAVING COUNT(d.delivery_id) > 10`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 10. Restaurant with most menu items
router.get('/most-menu-items-restaurant', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.restaurant_id, r.name FROM Restaurants r
      WHERE r.restaurant_id = (
        SELECT restaurant_id FROM Menu_Items
        GROUP BY restaurant_id ORDER BY COUNT(*) DESC LIMIT 1
      )`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 11. Orders with total item quantity greater than 5
router.get('/large-quantity-orders', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT oi.order_id, SUM(oi.quantity) AS total_items
      FROM Order_Items oi GROUP BY oi.order_id
      HAVING SUM(oi.quantity) > 5 ORDER BY total_items DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 12. Top 3 customers who spend the most
router.get('/top-3-customers', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.customer_id, c.full_name, SUM(o.total_amount) AS total_spent
      FROM Customer c JOIN Orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id, c.full_name
      ORDER BY total_spent DESC LIMIT 3`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 13. Restaurants with average order value greater than 500
router.get('/high-avg-order-restaurants', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.restaurant_id, r.name, AVG(o.total_amount) AS avg_order_value
      FROM Restaurants r JOIN Orders o ON r.restaurant_id = o.restaurant_id
      GROUP BY r.restaurant_id, r.name
      HAVING AVG(o.total_amount) > 500 ORDER BY avg_order_value DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 14. Orders that contain vegetarian items only
router.get('/veg-only-orders', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.order_id FROM Orders o
      WHERE NOT EXISTS (
        SELECT 1 FROM Order_Items oi JOIN Menu_Items m ON oi.item_id = m.item_id
        WHERE oi.order_id = o.order_id AND m.is_vegetarian = FALSE
      )`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 15. Delivery partners who have never been assigned an order
router.get('/unassigned-delivery-partners', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dp.dp_id, dp.full_name FROM Delivery_Partner dp
      LEFT JOIN Deliveries d ON dp.dp_id = d.dp_id
      WHERE d.dp_id IS NULL`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
