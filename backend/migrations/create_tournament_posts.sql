-- Migration: Create tournament_posts table
-- Run this SQL in your database

CREATE TABLE IF NOT EXISTS tournament_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  author_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tournament (tournament_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Optional: Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  team_name VARCHAR(100),
  status ENUM('REGISTERED', 'CONFIRMED', 'ELIMINATED') DEFAULT 'REGISTERED',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tournament (tournament_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (tournament_id, user_id)
);
