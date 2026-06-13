-- ============================================================
-- QuickByte Complete Setup Script
-- Run this in MySQL Workbench or via command line
-- This will DROP any existing database to give you a clean slate
-- and insert working dummy data so you can log in immediately.
-- ============================================================

DROP DATABASE IF EXISTS quickbyte;
CREATE DATABASE quickbyte;
USE quickbyte;

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE `auth` (
  `auth_id` varchar(15) NOT NULL PRIMARY KEY,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('CUSTOMER','RESTAURANT_OWNER','DELIVERY_PARTNER','ADMIN') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `auth_id` varchar(15) NOT NULL UNIQUE,
  `full_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`auth_id`) REFERENCES `auth` (`auth_id`) ON DELETE CASCADE
);

CREATE TABLE `customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `auth_id` varchar(15) NOT NULL UNIQUE,
  `phone_no` varchar(15) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`auth_id`) REFERENCES `auth` (`auth_id`) ON DELETE CASCADE
);

CREATE TABLE `restaurant_owner` (
  `owner_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `auth_id` varchar(15) NOT NULL UNIQUE,
  `phone_no` varchar(15) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`auth_id`) REFERENCES `auth` (`auth_id`) ON DELETE CASCADE
);

CREATE TABLE `delivery_partner` (
  `dp_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `auth_id` varchar(15) NOT NULL UNIQUE,
  `phone_no` varchar(15) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `vehicle_type` varchar(50) DEFAULT 'Bike',
  `city` varchar(100) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `avg_rating` decimal(3,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`auth_id`) REFERENCES `auth` (`auth_id`) ON DELETE CASCADE
);

CREATE TABLE `restaurants` (
  `restaurant_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `owner_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `cuisine_type` varchar(100) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `minimum_order_amount` decimal(10,2) DEFAULT '0.00',
  `avg_rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `is_approved` tinyint(1) DEFAULT '1',
  `is_open` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `restaurant_owner` (`owner_id`) ON DELETE CASCADE
);

CREATE TABLE `menu_items` (
  `item_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `availability_quantity` int DEFAULT '100',
  `is_vegetarian` tinyint(1) DEFAULT '1',
  `preparation_time` int DEFAULT '20',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
);

CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `status` enum('PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') DEFAULT 'PLACED',
  `delivery_charges` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `customer_address` text NOT NULL,
  `expected_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`)
);

CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `special_instruction` text,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`)
);

CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('UPI','CARD','WALLET','COD','NET_BANKING') DEFAULT 'COD',
  `status` enum('PENDING','COMPLETED','FAILED','REFUNDED') DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
);

CREATE TABLE `deliveries` (
  `delivery_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int NOT NULL,
  `dp_id` int NOT NULL,
  `status` enum('ASSIGNED','PICKED_UP','DELIVERED') DEFAULT 'ASSIGNED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  FOREIGN KEY (`dp_id`) REFERENCES `delivery_partner` (`dp_id`)
);

CREATE TABLE `commission` (
  `commission_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int NOT NULL,
  `dp_id` int DEFAULT NULL,
  `restaurant_id` int DEFAULT NULL,
  `delivery_commission_amount` decimal(10,2) DEFAULT '0.00',
  `restaurant_commission_amount` decimal(10,2) DEFAULT '0.00',
  `platform_profit` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  FOREIGN KEY (`dp_id`) REFERENCES `delivery_partner` (`dp_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`)
);

CREATE TABLE `rating` (
  `rating_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int NOT NULL UNIQUE,
  `restaurant_rating` tinyint DEFAULT '5',
  `delivery_rating` tinyint DEFAULT '5',
  `restaurant_review` text,
  `delivery_review` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
);

CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `receiver_role` enum('CUSTOMER','RESTAURANT_OWNER','DELIVERY_PARTNER','ADMIN') NOT NULL,
  `receiver_id` int DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. DUMMY DATA FOR ALL ROLES
-- The password for ALL users is: password123 
-- Hash: $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjQsJUuzPE
-- ============================================================

-- A. ADMIN
INSERT INTO `auth` (`auth_id`, `password_hash`, `role`) VALUES ('9999999999', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjQsJUuzPE', 'ADMIN');
INSERT INTO `admin` (`auth_id`, `full_name`) VALUES ('9999999999', 'Super Admin');

-- B. CUSTOMER
INSERT INTO `auth` (`auth_id`, `password_hash`, `role`) VALUES ('8888888888', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjQsJUuzPE', 'CUSTOMER');
INSERT INTO `customer` (`auth_id`, `full_name`, `phone_no`, `address`) VALUES ('8888888888', 'John Doe', '8888888888', '123 Fake Street, Delhi');

-- C. RESTAURANT OWNER
INSERT INTO `auth` (`auth_id`, `password_hash`, `role`) VALUES ('7777777777', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjQsJUuzPE', 'RESTAURANT_OWNER');
INSERT INTO `restaurant_owner` (`auth_id`, `full_name`, `phone_no`) VALUES ('7777777777', 'Chef Luigi', '7777777777');

-- D. DELIVERY PARTNER
INSERT INTO `auth` (`auth_id`, `password_hash`, `role`) VALUES ('6666666666', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjQsJUuzPE', 'DELIVERY_PARTNER');
INSERT INTO `delivery_partner` (`auth_id`, `full_name`, `phone_no`, `vehicle_type`) VALUES ('6666666666', 'Speedy Sam', '6666666666', 'Bike');


-- ============================================================
-- 3. DUMMY MENU DATA (so customer can browse immediately!)
-- ============================================================

-- Create a restaurant for Chef Luigi (owner_id = 1)
INSERT INTO `restaurants` (`restaurant_id`, `owner_id`, `name`, `cuisine_type`, `address`, `city`, `phone`, `avg_rating`, `minimum_order_amount`, `is_open`) 
VALUES (1, 1, 'Luigis Pizza', 'Italian', 'Connaught Place', 'Delhi', '011234567', 4.8, 150, 1);

-- Insert dummy menu items for this restaurant
INSERT INTO `menu_items` (`restaurant_id`, `name`, `price`, `availability_quantity`, `is_vegetarian`, `preparation_time`, `description`) VALUES 
(1, 'Margherita Pizza', 299, 50, 1, 15, 'Classic cheese and tomato pizza'),
(1, 'Pepperoni Pizza', 399, 40, 0, 20, 'Loaded with crispy pepperoni slices'),
(1, 'Garlic Bread', 149, 100, 1, 10, 'Freshly baked with garlic butter and herbs'),
(1, 'Pasta Alfredo', 249, 30, 1, 25, 'Creamy white sauce pasta with mushrooms');

-- ============================================================
-- 4. DUMMY ORDERS (for Admin/Restaurant analytics)
-- NOTE: We insert the order as READY_FOR_PICKUP first so the
--       before_delivery_insert trigger allows inserting the delivery row.
--       We then update the order to DELIVERED so before_commission_insert
--       allows the commission row to be inserted.
-- ============================================================

-- Step 1: Insert order in a state that allows delivery assignment
INSERT INTO `orders` (`order_id`, `customer_id`, `restaurant_id`, `status`, `delivery_charges`, `total_amount`, `customer_address`) 
VALUES (1, 1, 1, 'READY_FOR_PICKUP', 40.00, 0.00, '123 Fake Street, Delhi');
-- total_amount starts at 0; after_order_item_insert will auto-calculate it

-- Step 2: Insert order items (trigger fires → total_amount auto-updated to 439.00)
INSERT INTO `order_items` (`order_id`, `item_id`, `quantity`) VALUES (1, 2, 1); -- 1 Pepperoni Pizza = 399 + 40 delivery = 439

-- Step 3: Record payment
INSERT INTO `payment` (`order_id`, `customer_id`, `amount`, `payment_method`, `status`) 
VALUES (1, 1, 439.00, 'UPI', 'COMPLETED');

-- Step 4: Assign delivery (before_delivery_insert allows READY_FOR_PICKUP)
INSERT INTO `deliveries` (`order_id`, `dp_id`, `status`) VALUES (1, 1, 'DELIVERED');

-- Step 5: Mark order as DELIVERED (required before commission insert)
UPDATE `orders` SET `status` = 'DELIVERED' WHERE `order_id` = 1;

-- Step 6: Insert commission (before_commission_insert requires DELIVERED)
INSERT INTO `commission` (`order_id`, `dp_id`, `restaurant_id`, `delivery_commission_amount`, `restaurant_commission_amount`, `platform_profit`)
VALUES (1, 1, 1, 40.00, 43.90, 21.95);

-- ============================================================
-- 5. TRIGGERS
-- NOTE: Trigger execution order for a new order:
--   1. INSERT INTO orders  (total_amount = 0 by default)
--   2. INSERT INTO order_items  → after_order_item_insert fires → total_amount updated
-- This ensures total_amount is always consistent with actual items.
-- ============================================================

-- Trigger 1: After a review is inserted, update the restaurant's
--            average rating and total_reviews count.
DELIMITER $$

CREATE TRIGGER after_rating_insert
AFTER INSERT ON `rating`
FOR EACH ROW
BEGIN
    DECLARE v_restaurant_id INT;

    -- Resolve: rating → order → restaurant
    SELECT o.restaurant_id
    INTO   v_restaurant_id
    FROM   `orders` o
    WHERE  o.order_id = NEW.order_id;

    -- Recalculate avg_rating and total_reviews for that restaurant
    UPDATE `restaurants` r
    SET
        r.avg_rating = (
            SELECT ROUND(AVG(rt.restaurant_rating), 2)
            FROM   `rating`  rt
            JOIN   `orders`  o  ON o.order_id = rt.order_id
            WHERE  o.restaurant_id = v_restaurant_id
        ),
        r.total_reviews = (
            SELECT COUNT(*)
            FROM   `rating`  rt
            JOIN   `orders`  o  ON o.order_id = rt.order_id
            WHERE  o.restaurant_id = v_restaurant_id
        )
    WHERE r.restaurant_id = v_restaurant_id;
END$$

-- Trigger 2: After a review is inserted, update delivery partner's avg_rating.
CREATE TRIGGER after_rating_insert_update_dp
AFTER INSERT ON `rating`
FOR EACH ROW
BEGIN
    DECLARE v_dp_id INT;

    -- Resolve: rating → order → deliveries → dp_id
    SELECT d.dp_id
    INTO   v_dp_id
    FROM   `deliveries` d
    WHERE  d.order_id = NEW.order_id
    LIMIT 1;

    -- Only update if there is an assigned delivery partner
    IF v_dp_id IS NOT NULL THEN
        UPDATE `delivery_partner`
        SET avg_rating = (
            SELECT ROUND(AVG(rt.delivery_rating), 2)
            FROM   `rating`    rt
            JOIN   `deliveries` d ON d.order_id = rt.order_id
            WHERE  d.dp_id = v_dp_id
        )
        WHERE dp_id = v_dp_id;
    END IF;
END$$

-- Trigger 3: After a review is inserted, push a notification to
--            the restaurant owner informing them of the new review.
CREATE TRIGGER after_rating_insert_notify_owner
AFTER INSERT ON `rating`
FOR EACH ROW
BEGIN
    DECLARE v_restaurant_id INT;
    DECLARE v_owner_id      INT;
    DECLARE v_rest_name     VARCHAR(150);

    -- Resolve restaurant from the order
    SELECT o.restaurant_id
    INTO   v_restaurant_id
    FROM   `orders` o
    WHERE  o.order_id = NEW.order_id;

    -- Get owner_id and restaurant name
    SELECT r.owner_id, r.name
    INTO   v_owner_id, v_rest_name
    FROM   `restaurants` r
    WHERE  r.restaurant_id = v_restaurant_id;

    -- Insert a notification for the restaurant owner
    INSERT INTO `notification`
        (`receiver_role`, `receiver_id`, `message`)
    VALUES (
        'RESTAURANT_OWNER',
        v_owner_id,
        CONCAT(
            'New review received for "', v_rest_name,
            '" — Restaurant rating: ', NEW.restaurant_rating, '/5',
            IF(NEW.restaurant_review IS NOT NULL AND NEW.restaurant_review != '',
               CONCAT(' | "', NEW.restaurant_review, '"'), '')
        )
    );
END$$

-- ============================================================
-- Trigger 4: BEFORE INSERT on order_items
-- Ensures the menu item belongs to the same restaurant as the order.
-- Rejects the insert if there is a mismatch.
-- ============================================================
CREATE TRIGGER before_order_item_insert
BEFORE INSERT ON `order_items`
FOR EACH ROW
BEGIN
    DECLARE v_order_restaurant_id INT;
    DECLARE v_item_restaurant_id  INT;

    -- Get the restaurant_id of the order
    SELECT restaurant_id INTO v_order_restaurant_id
    FROM `orders`
    WHERE order_id = NEW.order_id;

    -- Get the restaurant_id of the menu item
    SELECT restaurant_id INTO v_item_restaurant_id
    FROM `menu_items`
    WHERE item_id = NEW.item_id;

    IF v_order_restaurant_id != v_item_restaurant_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Menu item does not belong to the restaurant of this order.';
    END IF;
END$$

-- ============================================================
-- Trigger 5: AFTER INSERT on order_items
-- Auto-recalculates orders.total_amount from all items + delivery_charges.
-- ============================================================
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE `orders`
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0)
        FROM `order_items` oi
        JOIN `menu_items` m ON m.item_id = oi.item_id
        WHERE oi.order_id = NEW.order_id
    ) + delivery_charges
    WHERE order_id = NEW.order_id;
END$$

-- ============================================================
-- Trigger 6: AFTER UPDATE on order_items
-- Re-syncs total_amount when an item quantity changes.
-- ============================================================
CREATE TRIGGER after_order_item_update
AFTER UPDATE ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE `orders`
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0)
        FROM `order_items` oi
        JOIN `menu_items` m ON m.item_id = oi.item_id
        WHERE oi.order_id = NEW.order_id
    ) + delivery_charges
    WHERE order_id = NEW.order_id;
END$$

-- ============================================================
-- Trigger 7: AFTER DELETE on order_items
-- Re-syncs total_amount when an item is removed from the order.
-- ============================================================
CREATE TRIGGER after_order_item_delete
AFTER DELETE ON `order_items`
FOR EACH ROW
BEGIN
    UPDATE `orders`
    SET total_amount = (
        SELECT COALESCE(SUM(oi.quantity * m.price), 0)
        FROM `order_items` oi
        JOIN `menu_items` m ON m.item_id = oi.item_id
        WHERE oi.order_id = OLD.order_id
    ) + delivery_charges
    WHERE order_id = OLD.order_id;
END$$

-- ============================================================
-- Trigger 8: BEFORE INSERT on deliveries
-- Prevents delivery assignment for orders that are PLACED or CANCELLED.
-- Valid order statuses for assignment: CONFIRMED, PREPARING,
-- READY_FOR_PICKUP, OUT_FOR_DELIVERY.
-- ============================================================
CREATE TRIGGER before_delivery_insert
BEFORE INSERT ON `deliveries`
FOR EACH ROW
BEGIN
    DECLARE v_order_status VARCHAR(30);

    SELECT status INTO v_order_status
    FROM `orders`
    WHERE order_id = NEW.order_id;

    IF v_order_status IN ('PLACED', 'CANCELLED', 'DELIVERED') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot assign delivery: order is not in a valid state for delivery.';
    END IF;
END$$

-- ============================================================
-- Trigger 9: BEFORE INSERT on rating
-- Allows rating only if the order status is DELIVERED.
-- ============================================================
CREATE TRIGGER before_rating_insert
BEFORE INSERT ON `rating`
FOR EACH ROW
BEGIN
    DECLARE v_order_status VARCHAR(30);

    SELECT status INTO v_order_status
    FROM `orders`
    WHERE order_id = NEW.order_id;

    IF v_order_status IS NULL OR v_order_status != 'DELIVERED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot rate an order that has not been delivered yet.';
    END IF;
END$$

-- ============================================================
-- Trigger 10: BEFORE INSERT on commission
-- Commission can only be recorded for fully DELIVERED orders.
-- ============================================================
CREATE TRIGGER before_commission_insert
BEFORE INSERT ON `commission`
FOR EACH ROW
BEGIN
    DECLARE v_order_status VARCHAR(30);

    SELECT status INTO v_order_status
    FROM `orders`
    WHERE order_id = NEW.order_id;

    IF v_order_status IS NULL OR v_order_status != 'DELIVERED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Commission can only be recorded for delivered orders.';
    END IF;
END$$

DELIMITER ;

SELECT 'QuickByte Database Setup Complete! You can now log in.' AS Result;
