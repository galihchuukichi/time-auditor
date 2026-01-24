-- Run this script in your Supabase SQL Editor to ensure your tables have the necessary columns.

-- 1. Add 'tier' column to 'shop_items' table
-- This allows the Shop Manager to save the rarity/probability of items.
ALTER TABLE shop_items 
ADD COLUMN IF NOT EXISTS tier int2 DEFAULT 4;

-- 2. Add 'aura_colors' column to 'casino_rewards' table
-- This supports the custom aura feature for legendary items.
ALTER TABLE casino_rewards 
ADD COLUMN IF NOT EXISTS aura_colors text[];

-- 3. Add 'aura_colors' column to 'inventory' table
-- This ensures that acquired items retain their custom aura settings.
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS aura_colors text[];
