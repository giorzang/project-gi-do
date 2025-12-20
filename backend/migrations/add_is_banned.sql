-- Add is_banned column to users table for admin panel
-- Run: mysql -u root -p your_database < add_is_banned.sql

ALTER TABLE users 
ADD COLUMN is_banned TINYINT(1) DEFAULT 0 AFTER is_admin;
