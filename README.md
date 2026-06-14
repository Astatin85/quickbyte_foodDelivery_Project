# QuickBite - Food Delivery Platform

## Overview

QuickBite is a multi-user food delivery platform designed to connect customers, restaurants, delivery partners, and administrators within a unified ecosystem. The system enables food ordering, delivery management, payment tracking, ratings, and notifications while maintaining strong data integrity through a robust relational database design.

The project was developed with a focus on database-driven business logic, transaction consistency, role-based access control, and real-world food delivery workflows.

---

## Key Features

### Customer Module

* User registration and authentication
* Browse restaurants and menu items
* Place food orders
* Track order status
* View order history
* Rate restaurants and delivery experience

### Restaurant Module

* Restaurant profile management
* Menu management
* Update item availability
* Process incoming orders
* Update order status
* View customer feedback

### Delivery Partner Module

* Receive delivery assignments
* Manage delivery status
* Track assigned deliveries
* Commission calculation support

### Admin Module

* Monitor platform activity
* Manage customers, restaurants, and delivery partners
* View all orders
* Deactivate users or restaurants
* Maintain platform integrity

---

## Order Lifecycle

```text
Customer Places Order
          ↓
Restaurant Accepts Order
          ↓
Preparing
          ↓
Delivery Partner Assigned
          ↓
Out For Delivery
          ↓
Delivered
```

Supported statuses:

* Placed
* Preparing
* Delivered
* Cancelled

---

## Technology Stack

| Layer           | Technology                      |
| --------------- | ------------------------------- |
| Backend         | Node.js                         |
| Database        | SQL Relational Database         |
| Authentication  | Role-Based Access Control       |
| API Design      | RESTful Routes                  |
| Data Validation | Database Constraints & Triggers |

---

## System Architecture

The platform follows a modular architecture with separate components for:

* Authentication
* Customer Operations
* Restaurant Operations
* Delivery Management
* Order Processing
* Notifications
* Analytics

Core route modules:

* auth.js
* customer.js
* restaurant.js
* delivery.js
* admin.js
* analytics.js

---

## Database Design

The system uses a normalized relational database structure supporting:

### Core Entities

* Auth
* Customer
* Restaurant
* Delivery Partner
* Orders
* Order Items
* Payments
* Deliveries
* Ratings
* Notifications
* Commission

### Key Relationships

* One Customer → Many Orders
* One Restaurant → Many Orders
* One Restaurant → Many Menu Items
* One Order → Many Order Items
* One Delivery Partner → Many Deliveries
* One Order → One Payment

---

## Database Constraints

Implemented constraints include:

* Unique phone numbers
* Fixed user roles
* Foreign key integrity
* One payment per order
* Unique menu item names within a restaurant
* Referential integrity across all entities

These constraints help prevent duplicate, inconsistent, or invalid data.

---

## Security Features

* Role-based authentication
* User access control
* Data validation at multiple levels
* Protected business operations
* Secure order ownership checks

Supported roles:

* ADMIN
* CUSTOMER
* OWNER
* DELIVERY_PARTNER

---

## Business Logic Highlights

* Order assignment workflows
* Payment processing (Cash on Delivery)
* Restaurant inventory validation
* Delivery tracking
* Notification management
* Commission calculation
* Customer rating system

---

## Future Improvements

* Real-time delivery tracking
* Online payment gateway integration
* Recommendation engine
* Restaurant analytics dashboard
* Dynamic pricing and offers
* Mobile application support

---

## Team Members

* Aadi Singh
* Tarandeep Singh Wadhwa
* Varun Mehta

---

## Learning Outcomes

This project strengthened practical understanding of:

* Database Design
* ER Modeling
* Relational Schemas
* SQL Constraints
* Database Normalization
* Backend API Development
* Multi-user System Design
* Business Rule Enforcement
* Transaction Management

---

## Project Goal

To design and implement a scalable food delivery platform capable of handling interactions between customers, restaurants, delivery partners, and administrators while ensuring data consistency, operational efficiency, and a seamless ordering experience.
