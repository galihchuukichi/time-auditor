-- Time Auditor Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('reward', 'punishment')),
  points DOUBLE PRECISION NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline entries table
CREATE TABLE IF NOT EXISTS timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  type TEXT CHECK (type IN ('planning', 'auditing')),
  time_slot TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User data (points, etc)
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE DEFAULT '00000000-0000-0000-0000-000000000000',
  current_points DOUBLE PRECISION DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase history
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  item_id UUID,
  item_name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  points_change DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - can add authentication later)
DROP POLICY IF EXISTS "Allow all activities" ON activities;
CREATE POLICY "Allow all activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all shop_items" ON shop_items;
CREATE POLICY "Allow all shop_items" ON shop_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all timeline_entries" ON timeline_entries;
CREATE POLICY "Allow all timeline_entries" ON timeline_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all user_data" ON user_data;
CREATE POLICY "Allow all user_data" ON user_data FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all purchase_history" ON purchase_history;
CREATE POLICY "Allow all purchase_history" ON purchase_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all logs" ON logs;
CREATE POLICY "Allow all logs" ON logs FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_user_id ON shop_items(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_user_id ON timeline_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_date ON timeline_entries(date);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Casino rewards table
CREATE TABLE IF NOT EXISTS casino_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  min_roll INTEGER NOT NULL CHECK (min_roll >= 1 AND min_roll <= 6),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Casino game history table
CREATE TABLE IF NOT EXISTS casino_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  game TEXT NOT NULL DEFAULT 'dice',
  roll INTEGER NOT NULL,
  cost DOUBLE PRECISION NOT NULL,
  won BOOLEAN NOT NULL DEFAULT false,
  reward_id UUID,
  reward_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for casino tables
ALTER TABLE casino_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for casino tables
DROP POLICY IF EXISTS "Allow all casino_rewards" ON casino_rewards;
CREATE POLICY "Allow all casino_rewards" ON casino_rewards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all casino_history" ON casino_history;
CREATE POLICY "Allow all casino_history" ON casino_history FOR ALL USING (true) WITH CHECK (true);

-- Indexes for casino tables
CREATE INDEX IF NOT EXISTS idx_casino_rewards_user_id ON casino_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_history_user_id ON casino_history(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_history_created_at ON casino_history(created_at);
