-- UPDATED: Change game_mode to separate boolean columns
-- One map can be in both competitive AND wingman pools
-- Run: mysql -u root -p your_database < add_map_game_mode.sql

-- Drop old enum column if exists (ignore error if not exists)
-- ALTER TABLE maps DROP COLUMN game_mode;

-- Add separate boolean columns
ALTER TABLE maps 
ADD COLUMN is_competitive TINYINT(1) DEFAULT 1 AFTER is_active,
ADD COLUMN is_wingman TINYINT(1) DEFAULT 0 AFTER is_competitive;

-- Set default maps for wingman (adjust as needed)
-- UPDATE maps SET is_wingman = 1 WHERE map_key IN ('de_inferno', 'de_nuke', 'de_overpass', 'de_vertigo', 'de_shortnuke');
