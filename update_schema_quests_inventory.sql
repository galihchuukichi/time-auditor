-- Add missing tables for Quests and Inventory
-- Run this in your Supabase SQL Editor

-- Inventory table (Syncs with InventoryItem type)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  reward_id UUID,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  tier INTEGER,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  aura_colors TEXT[], -- Array of strings for colors
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quests table (Syncs with Quest type)
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  type TEXT CHECK (type IN ('daily', 'weekly', 'one-time')),
  title TEXT NOT NULL,
  description TEXT,
  points DOUBLE PRECISION NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('once', 'repeat')),
  is_completed BOOLEAN DEFAULT false,
  last_completed_at TIMESTAMPTZ,
  target_value INTEGER DEFAULT 1,
  current_value INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'times',
  days_of_week INTEGER[], -- Array of numbers (0-6)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow all inventory" ON inventory;
CREATE POLICY "Allow all inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all quests" ON quests;
CREATE POLICY "Allow all quests" ON quests FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
