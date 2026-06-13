/**
 * Notification helper — sends automatic notifications for order events
 * All messages are customer-focused so they know exactly what's happening with their order
 */

const MESSAGES = {
  ORDER_PLACED: (orderId, restName) =>
    `🆕 Your order #${orderId} has been placed at ${restName}! Waiting for restaurant confirmation.`,

  ORDER_CONFIRMED: (orderId, restName) =>
    `✅ Your order #${orderId} from ${restName} has been confirmed! They're getting ready to cook.`,

  ORDER_PREPARING: (orderId, restName) =>
    `👨‍🍳 Your order #${orderId} from ${restName} is now being prepared! Won't be long.`,

  ORDER_READY: (orderId, restName) =>
    `🟢 Your order #${orderId} from ${restName} is ready for pickup! A delivery partner will be assigned shortly.`,

  ORDER_PICKED_UP: (orderId) =>
    `🛵 Your order #${orderId} has been picked up and is on the way to you! Get ready!`,

  ORDER_DELIVERED: (orderId) =>
    `🎉 Your order #${orderId} has been delivered! Enjoy your meal. Rate your experience.`,

  ORDER_CANCELLED: (orderId) =>
    `❌ Your order #${orderId} has been cancelled. If you have questions, contact support.`,

  // Delivery partner notifications
  DP_ASSIGNED: (orderId, restName, address) =>
    `📦 New delivery assigned! Order #${orderId} from ${restName}. Deliver to: ${address}`,

  DP_DELIVERED_DONE: (orderId, commission) =>
    `💰 Order #${orderId} delivered! You earned ₹${commission} commission. You are now available.`,

  // Restaurant owner notifications
  REST_NEW_ORDER: (orderId, customerName) =>
    `🆕 New order #${orderId} from ${customerName}! Please confirm it.`,
};

/**
 * Send a notification to DB
 * @param {object} db - database connection
 * @param {string} role - CUSTOMER | RESTAURANT_OWNER | DELIVERY_PARTNER
 * @param {number} receiverId - the ID (customer_id / owner_id / dp_id)
 * @param {string} message - notification text
 */
async function sendNotification(db, role, receiverId, message) {
  try {
    await db.query(
      'INSERT INTO notification (receiver_role, receiver_id, message) VALUES (?, ?, ?)',
      [role, receiverId, message]
    );
  } catch (err) {
    console.error('[Notification] Failed to insert:', err.message);
  }
}

module.exports = { MESSAGES, sendNotification };
