-- ============================================================
-- Cleanup Script: Remove AnalyticsSeeder fake data
-- Restores DB to admin-entered data only
-- Run: C:\xampp\mysql\bin\mysql.exe -u root arbiter_coffee_hub < cleanup_analytics_seed.sql
-- ============================================================

USE arbiter_coffee_hub;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Remove order items for fake analytics orders ──────────
DELETE FROM order_items
WHERE order_id IN (
    SELECT id FROM orders
    WHERE user_id IN (5,6,7,8,9,10,11,12)
);

-- ── 2. Remove fake analytics orders ─────────────────────────
DELETE FROM orders
WHERE user_id IN (5,6,7,8,9,10,11,12);

-- ── 3. Remove fake analytics products (IDs 11–24) ───────────
--    These all have descriptions containing "customer favourite"
--    and were created by AnalyticsSeeder on 2026-03-02
DELETE FROM products WHERE id BETWEEN 11 AND 24;

-- ── 4. Remove duplicate / test coffee beans (IDs 6–12) ──────
--    ID 6:  "Test Update"  — obvious test entry
--    IDs 7–11: exact duplicates of original beans 2–5 + Ethiopian
--    ID 12: "Test Bean"   — obvious test entry
DELETE FROM coffee_beans WHERE id BETWEEN 6 AND 12;

-- ── 5. Remove fake analytics customer accounts ───────────────
--    These are the 8 @example.com users created by AnalyticsSeeder
DELETE FROM personal_access_tokens WHERE tokenable_id IN (5,6,7,8,9,10,11,12);
DELETE FROM model_has_roles WHERE model_id IN (5,6,7,8,9,10,11,12);
DELETE FROM users WHERE id IN (5,6,7,8,9,10,11,12);

SET FOREIGN_KEY_CHECKS = 1;

-- ── Verification ─────────────────────────────────────────────
SELECT 'Users remaining:'        AS label, COUNT(*) AS count FROM users;
SELECT 'Products remaining:'     AS label, COUNT(*) AS count FROM products;
SELECT 'Orders remaining:'       AS label, COUNT(*) AS count FROM orders;
SELECT 'Coffee Beans remaining:' AS label, COUNT(*) AS count FROM coffee_beans;
SELECT 'Categories:'             AS label, COUNT(*) AS count FROM categories;
SELECT 'Announcements:'          AS label, COUNT(*) AS count FROM announcements;
