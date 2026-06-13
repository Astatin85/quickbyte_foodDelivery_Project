-- ============================================================
-- QuickByte Database Schema
-- Run this file in MySQL to set up all tables
-- MySQL: Host=localhost, Port=3306, User=root, Pass=Taran1#1
-- ============================================================

CREATE DATABASE IF NOT EXISTS quickbyte;
USE quickbyte;

-- ============================================================
-- 1. AUTH TABLE (auth_id = mobile number)
-- ============================================================
CREATE TABLE IF NOT EXISTS Auth (
    auth_id       VARCHAR(15)  PRIMARY KEY,   -- mobile number
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('CUSTOMER','RESTAURANT_OWNER','DELIVERY_PARTNER','ADMIN') NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS Admin (
    admin_id   INT          PRIMARY KEY AUTO_INCREMENT,
    auth_id    VARCHAR(15)  NOT NULL UNIQUE,
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(150),
    phone      VARCHAR(15),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_id) REFERENCES Auth(auth_id) ON DELETE CASCADE
);

-- ============================================================
-- 3. CUSTOMER
-- ============================================================
CREATE TABLE IF NOT EXISTS Customer (
    customer_id INT          PRIMARY KEY AUTO_INCREMENT,
    auth_id     VARCHAR(15)  NOT NULL UNIQUE,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(150),
    phone       VARCHAR(15),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_id) REFERENCES Auth(auth_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. RESTAURANT OWNER
-- ============================================================
CREATE TABLE IF NOT EXISTS Restaurant_Owner (
    owner_id   INT          PRIMARY KEY AUTO_INCREMENT,
    auth_id    VARCHAR(15)  NOT NULL UNIQUE,
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(150),
    phone      VARCHAR(15),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_id) REFERENCES Auth(auth_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. DELIVERY PARTNER
-- ============================================================
CREATE TABLE IF NOT EXISTS Delivery_Partner (
    dp_id          INT          PRIMARY KEY AUTO_INCREMENT,
    auth_id        VARCHAR(15)  NOT NULL UNIQUE,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150),
    phone          VARCHAR(15),
    vehicle_type   VARCHAR(50)  DEFAULT 'Bike',
    is_available   BOOLEAN      NOT NULL DEFAULT TRUE,
    avg_rating     DECIMAL(3,2) DEFAULT 0.00,
    total_deliveries INT        DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_id) REFERENCES Auth(auth_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS Restaurants (
    restaurant_id        INT          PRIMARY KEY AUTO_INCREMENT,
    owner_id             INT          NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    cuisine_type         VARCHAR(100),
    address              TEXT,
    city                 VARCHAR(100),
    phone                VARCHAR(15),
    minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
    avg_rating           DECIMAL(3,2)  DEFAULT 0.00,
    total_reviews        INT           DEFAULT 0,
    is_approved          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Restaurant_Owner(owner_id) ON DELETE CASCADE
);

-- ============================================================
-- 7. MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS Menu_Items (
    item_id          INT           PRIMARY KEY AUTO_INCREMENT,
    restaurant_id    INT           NOT NULL,
    name             VARCHAR(150)  NOT NULL,
    price            DECIMAL(10,2) NOT NULL,
    is_vegetarian    BOOLEAN       NOT NULL DEFAULT TRUE,
    preparation_time INT           DEFAULT 20,   -- minutes
    description      TEXT,
    quantity         INT           DEFAULT 100,
    is_available     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id) ON DELETE CASCADE
);

-- ============================================================
-- 8. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS Orders (
    order_id         INT           PRIMARY KEY AUTO_INCREMENT,
    customer_id      INT           NOT NULL,
    restaurant_id    INT           NOT NULL,
    status           ENUM('PLACED','CONFIRMED','PREPARING','READY_FOR_PICKUP',
                          'OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
                     NOT NULL DEFAULT 'PLACED',
    delivery_charges DECIMAL(10,2) DEFAULT 0.00,
    total_amount     DECIMAL(10,2) NOT NULL,
    customer_address TEXT,
    expected_time    INT,                         -- minutes
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id)   REFERENCES Customer(customer_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id)
);

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS Order_Items (
    order_item_id       INT  PRIMARY KEY AUTO_INCREMENT,
    order_id            INT  NOT NULL,
    item_id             INT  NOT NULL,
    quantity            INT  NOT NULL DEFAULT 1,
    special_instruction TEXT,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id)  REFERENCES Menu_Items(item_id)
);

-- ============================================================
-- 10. PAYMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS Payment (
    payment_id     INT           PRIMARY KEY AUTO_INCREMENT,
    order_id       INT           NOT NULL,
    customer_id    INT           NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    payment_method ENUM('UPI','CARD','WALLET','COD','NET_BANKING') DEFAULT 'COD',
    status         ENUM('PENDING','COMPLETED','FAILED','REFUNDED')  DEFAULT 'PENDING',
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id)    REFERENCES Orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

-- ============================================================
-- 11. DELIVERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS Deliveries (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id    INT NOT NULL,
    dp_id       INT NOT NULL,
    status      ENUM('ASSIGNED','PICKED_UP','DELIVERED') NOT NULL DEFAULT 'ASSIGNED',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (dp_id)    REFERENCES Delivery_Partner(dp_id)
);

-- ============================================================
-- 12. RATING
-- ============================================================
CREATE TABLE IF NOT EXISTS Rating (
    rating_id        INT PRIMARY KEY AUTO_INCREMENT,
    order_id         INT NOT NULL UNIQUE,
    restaurant_rating TINYINT DEFAULT 5,          -- 1 to 5
    delivery_rating   TINYINT DEFAULT 5,          -- 1 to 5
    restaurant_review TEXT,
    delivery_review   TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- ============================================================
-- 13. COMMISSION
-- ============================================================
CREATE TABLE IF NOT EXISTS Commission (
    commission_id         INT           PRIMARY KEY AUTO_INCREMENT,
    order_id              INT           NOT NULL,
    dp_id                 INT,
    restaurant_id         INT,
    delivery_commission   DECIMAL(10,2) DEFAULT 0.00,
    restaurant_commission DECIMAL(10,2) DEFAULT 0.00,
    platform_profit       DECIMAL(10,2) DEFAULT 0.00,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id)       REFERENCES Orders(order_id),
    FOREIGN KEY (dp_id)          REFERENCES Delivery_Partner(dp_id),
    FOREIGN KEY (restaurant_id)  REFERENCES Restaurants(restaurant_id)
);

-- ============================================================
-- 14. NOTIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS Notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    receiver_role   ENUM('CUSTOMER','RESTAURANT_OWNER','DELIVERY_PARTNER','ADMIN') NOT NULL,
    receiver_id     INT,
    message         TEXT NOT NULL,
    is_read         BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SAMPLE SEED DATA (optional – remove if you want a clean DB)
-- ============================================================

-- Insert a default Admin account
-- Mobile: 9999999999, Password: Admin@123
INSERT IGNORE INTO Auth (auth_id, password_hash, role) VALUES
('9999999999', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh/K', 'ADMIN');
-- Password hash above = bcrypt of 'Admin@123'

INSERT IGNORE INTO Admin (auth_id, full_name, email) VALUES
('9999999999', 'Super Admin', 'admin@quickbyte.com');

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'Schema created successfully!' AS status;
SHOW TABLES;
