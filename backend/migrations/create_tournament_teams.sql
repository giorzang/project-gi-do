-- Migration: Create tournament teams tables
-- Run this SQL in your database

-- Teams table
CREATE TABLE IF NOT EXISTS tournament_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  captain_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tournament (tournament_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Team members table
CREATE TABLE IF NOT EXISTS tournament_team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  role ENUM('CAPTAIN', 'MEMBER') DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id),
  FOREIGN KEY (team_id) REFERENCES tournament_teams(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (team_id, user_id)
);

-- Join requests table
CREATE TABLE IF NOT EXISTS tournament_join_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id),
  FOREIGN KEY (team_id) REFERENCES tournament_teams(id) ON DELETE CASCADE
);
