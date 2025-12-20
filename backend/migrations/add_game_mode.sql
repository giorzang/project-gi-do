-- Add game_mode column to matches table
-- Run: mysql -u root -p your_database < add_game_mode.sql

ALTER TABLE matches 
ADD COLUMN game_mode ENUM('competitive', 'wingman') DEFAULT 'competitive' AFTER is_captain_mode;
