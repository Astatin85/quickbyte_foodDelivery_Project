-- ================================================================
-- QuickByte – Concurrent Transaction Scenarios
-- Database: quickbyte
-- Purpose : Demonstrate concurrency conflicts using START TRANSACTION,
--           COMMIT, and ROLLBACK across three realistic scenarios.
--
-- HOW TO TEST:
--   Open two separate MySQL sessions (two tabs in MySQL Workbench).
--   Copy Transaction 1 steps into Session 1 and Transaction 2 steps
--   into Session 2. Execute them in the order shown, pausing between
--   steps to simulate concurrent execution.
-- ================================================================

USE quickbyte;


-- ================================================================
-- SCENARIO 1: STOCK QUANTITY CONFLICT
-- Two customers try to order the last unit of a menu item at the
-- same time. Only one should succeed; the other should be rolled back.
-- 
-- Table affected: menu_items (availability_quantity)
-- Conflict type : Lost Update / Race Condition
-- ================================================================

-- ── Assume item_id = 1 has availability_quantity = 1 (last unit) ──
-- Run this first to set up the conflict state:
UPDATE menu_items SET availability_quantity = 1 WHERE item_id = 1;

-- ────────────────────────────────────────
-- TRANSACTION 1  (Customer A – Session 1)
-- ────────────────────────────────────────

START TRANSACTION;                          -- T1 begins

-- T1 reads the current stock quantity
SELECT item_id, name, availability_quantity
FROM   menu_items
WHERE  item_id = 1
FOR UPDATE;                                 -- row-level lock: T2 will now BLOCK here
-- ↑ Result: availability_quantity = 1  (last unit available)

-- T1 reduces quantity by 1 (Customer A claims the last item)
UPDATE menu_items
SET    availability_quantity = availability_quantity - 1
WHERE  item_id = 1;

-- *** PAUSE HERE – before committing, Session 2 runs T2 ***
-- (T2 will be blocked at its SELECT ... FOR UPDATE until T1 commits)

COMMIT;                                     -- T1 commits → stock is now 0
-- After T1 commits, T2's SELECT ... FOR UPDATE unblocks and sees qty = 0.


-- ────────────────────────────────────────
-- TRANSACTION 2  (Customer B – Session 2)
-- Run these steps while T1 is paused before its COMMIT
-- ────────────────────────────────────────

START TRANSACTION;                          -- T2 begins

-- T2 also wants the same item; it tries to lock the row
-- ⚠️ CONCURRENCY CONFLICT: This statement BLOCKS because T1 already
-- holds an exclusive lock via SELECT ... FOR UPDATE.
SELECT item_id, name, availability_quantity
FROM   menu_items
WHERE  item_id = 1
FOR UPDATE;
-- ↑ Unblocks after T1 commits → now reads availability_quantity = 0

-- T2 checks: is there stock left?
-- In application logic you would check here and rollback if qty = 0.
-- We simulate that check with a conditional ROLLBACK:

-- ⚠️ ROLLBACK POINT: quantity is 0, so T2 cannot fulfil the order.
ROLLBACK;
-- T2 is rolled back; Customer B receives "Item out of stock" error.

-- Reset for re-testing:
-- UPDATE menu_items SET availability_quantity = 1 WHERE item_id = 1;


-- ================================================================
-- SCENARIO 2: ORDER STATUS CONFLICT
-- A customer tries to cancel an order at the exact moment the
-- restaurant marks it as 'Preparing'. Both write to the same row.
--
-- Table affected: orders (status)
-- Conflict type : Conflicting Updates / Lost Update
-- ================================================================

-- ── Assume order_id = 1 currently has status = 'CONFIRMED' ──
UPDATE orders SET status = 'CONFIRMED' WHERE order_id = 1;

-- ────────────────────────────────────────
-- TRANSACTION 1  (Restaurant – Session 1)
-- ────────────────────────────────────────

START TRANSACTION;                          -- T1 begins

-- Restaurant reads the order to verify it is CONFIRMED before cooking
SELECT order_id, status FROM orders WHERE order_id = 1;
-- ↑ Sees status = 'CONFIRMED' → safe to start preparing

-- Restaurant updates status to 'Preparing'
UPDATE orders SET status = 'PREPARING' WHERE order_id = 1;

-- *** PAUSE HERE – before committing, Session 2 runs T2 ***

COMMIT;                                     -- T1 commits → status = 'PREPARING'


-- ────────────────────────────────────────
-- TRANSACTION 2  (Customer – Session 2)
-- Run these steps while T1 is paused before its COMMIT
-- ────────────────────────────────────────

START TRANSACTION;                          -- T2 begins

-- Customer reads the order (still sees 'CONFIRMED' because T1 hasn't committed yet)
SELECT order_id, status FROM orders WHERE order_id = 1;
-- ↑ Reads 'CONFIRMED' (stale view under READ COMMITTED)
-- ⚠️ CONCURRENCY CONFLICT: Customer believes cancellation is still valid

-- Customer updates status to 'Cancelled'
-- Under READ COMMITTED this UPDATE will block if T1 holds a row lock,
-- OR will succeed after T1 commits, overwriting 'PREPARING' with 'CANCELLED'.
UPDATE orders SET status = 'CANCELLED' WHERE order_id = 1;

-- ⚠️ CONFLICT OUTCOME: Whichever transaction commits last wins.
-- If T2 commits after T1 → order ends up 'CANCELLED' even though
-- the restaurant already started preparing it. This is a LOST UPDATE.

COMMIT;                                     -- T2 commits → status = 'CANCELLED'
-- The restaurant's 'PREPARING' update is silently overwritten.

-- To prevent this, the application should:
--   1. Check status inside the transaction before updating, and ROLLBACK if changed.
--   2. Or use SELECT ... FOR UPDATE to hold the row lock until commit.

-- Reset:
-- UPDATE orders SET status = 'CONFIRMED' WHERE order_id = 1;


-- ================================================================
-- SCENARIO 3: DELIVERY PARTNER ASSIGNMENT CONFLICT
-- Two orders are placed at the same time and both try to assign
-- the same (only available) delivery partner.
--
-- Tables affected: delivery_partner (is_available), deliveries
-- Conflict type  : Resource Double-Booking / Race Condition
-- ================================================================

-- ── Assume dp_id = 1 is available, and we have two pending orders ──
-- Ensure the delivery partner is marked available:
UPDATE delivery_partner SET is_available = 1 WHERE dp_id = 1;

-- Create two orders that need assignment (skip triggers by using valid states):
-- (Using existing order_id = 1; imagine order_id = 2 also exists)
UPDATE orders SET status = 'READY_FOR_PICKUP' WHERE order_id = 1;


-- ────────────────────────────────────────
-- TRANSACTION 1  (Order #1 being assigned – Session 1)
-- ────────────────────────────────────────

START TRANSACTION;                          -- T1 begins

-- T1 looks for an available delivery partner
SELECT dp_id, full_name, is_available
FROM   delivery_partner
WHERE  is_available = 1
LIMIT  1;
-- ↑ Returns dp_id = 1  (is_available = 1)
-- ⚠️ CONCURRENCY CONFLICT: T2 will read the same row in its SELECT
--    because T1 has NOT yet updated is_available to 0.

-- T1 assigns dp_id = 1 to Order #1
INSERT INTO deliveries (order_id, dp_id, status) VALUES (1, 1, 'ASSIGNED');

-- T1 marks the delivery partner as Busy
UPDATE delivery_partner SET is_available = 0 WHERE dp_id = 1;

-- *** PAUSE HERE – before committing, Session 2 runs T2 ***

COMMIT;                                     -- T1 commits → dp is now Busy


-- ────────────────────────────────────────
-- TRANSACTION 2  (Order #2 being assigned – Session 2)
-- Run these steps while T1 is paused before its COMMIT
-- ────────────────────────────────────────

START TRANSACTION;                          -- T2 begins

-- T2 also queries for an available delivery partner
-- ⚠️ CONFLICT POINT: Under READ COMMITTED, T2 still sees is_available = 1
-- because T1 has not committed yet → T2 picks the same partner!
SELECT dp_id, full_name, is_available
FROM   delivery_partner
WHERE  is_available = 1
LIMIT  1;
-- ↑ Still returns dp_id = 1  (T1's UPDATE not yet visible)

-- T2 tries to assign the same dp_id = 1 to Order #2
-- NOTE: If Order #2 doesn't exist in your DB, this INSERT will fail
--       with a FK violation. Replace with a valid order_id if needed.
-- INSERT INTO deliveries (order_id, dp_id, status) VALUES (2, 1, 'ASSIGNED');

-- T2 also tries to mark the partner as Busy
UPDATE delivery_partner SET is_available = 0 WHERE dp_id = 1;

-- If both INSERT statements above succeed (before each other's commit),
-- the same delivery partner ends up assigned to TWO orders simultaneously.
-- This is a classic DOUBLE-BOOKING race condition.

-- ⚠️ ROLLBACK POINT: After T1 commits, application logic should detect
-- the partner is already busy and rollback T2:
ROLLBACK;
-- T2 rolls back → Order #2 must wait for another available partner.

-- To prevent this race condition use SELECT ... FOR UPDATE in Step 1:
--   SELECT dp_id FROM delivery_partner WHERE is_available = 1 LIMIT 1 FOR UPDATE;
-- This forces T2 to block until T1 releases the lock after COMMIT.

-- Reset:
-- UPDATE delivery_partner SET is_available = 1 WHERE dp_id = 1;
-- DELETE FROM deliveries WHERE order_id = 1 AND dp_id = 1;
