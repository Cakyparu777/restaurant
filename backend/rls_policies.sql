-- ============================================================
-- Row Level Security (RLS) Policies for Supabase
-- Run this in Supabase SQL Editor AFTER deploying
-- ============================================================
-- NOTE: These policies apply to DIRECT Supabase access (e.g., supabase-js).
-- Our FastAPI backend uses its own DB credentials and already enforces
-- tenant isolation via restaurant_id checks in every query.
-- RLS is an ADDITIONAL defense layer.

-- ============================================================
-- 1. Enable RLS on all application tables
-- ============================================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Restaurants
-- ============================================================
-- Owners can manage their own restaurant
CREATE POLICY "owners_manage_restaurant" ON restaurants
  USING (id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

-- Public can read active restaurants (for menu pages)
CREATE POLICY "public_read_active_restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- ============================================================
-- 3. Tables
-- ============================================================
-- Owners/staff can CRUD their restaurant's tables
CREATE POLICY "staff_manage_tables" ON tables
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

-- Public can validate active tables (QR scan → resolve token)
CREATE POLICY "public_read_active_tables" ON tables
  FOR SELECT USING (is_active = true);

-- ============================================================
-- 4. Categories & Menu Items
-- ============================================================
-- Staff manage their own
CREATE POLICY "staff_manage_categories" ON categories
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "staff_manage_menu_items" ON menu_items
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

-- Public can read categories/items for active restaurants
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (
    is_active = true
    AND restaurant_id IN (SELECT id FROM restaurants WHERE is_active = true)
  );

CREATE POLICY "public_read_menu_items" ON menu_items
  FOR SELECT USING (
    is_available = true
    AND restaurant_id IN (SELECT id FROM restaurants WHERE is_active = true)
  );

-- ============================================================
-- 5. Orders
-- ============================================================
-- Staff can read/update their restaurant's orders
CREATE POLICY "staff_manage_orders" ON orders
  USING (restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid()));

-- Public can INSERT orders (customers placing orders via menu)
CREATE POLICY "public_insert_orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Order items follow parent order access
CREATE POLICY "staff_manage_order_items" ON order_items
  USING (order_id IN (
    SELECT id FROM orders
    WHERE restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "public_insert_order_items" ON order_items
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 6. Users
-- ============================================================
-- Users can read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

-- ============================================================
-- 7. Subscriptions
-- ============================================================
CREATE POLICY "staff_read_subscription" ON subscriptions
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM users WHERE id = auth.uid())
  );
