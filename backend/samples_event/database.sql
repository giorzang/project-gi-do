DROP DATABASE IF EXISTS cs2giorzang;

CREATE DATABASE IF NOT EXISTS cs2giorzang;
USE cs2giorzang;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(20) NOT NULL, -- backend se check dieu kien username thay vi sql CHECK (profile_name REGEXP '^[A-Za-z0-9._]{3,20}$')
    avatar_url TEXT,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1. Bảng Servers: Lưu danh sách server CS2 mà bạn có
CREATE TABLE IF NOT EXISTS servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL, -- Ví dụ: "Server Hà Nội 1"
    ip VARCHAR(50) NOT NULL,            -- Ví dụ: "103.1.1.1"
    port INT NOT NULL,
    rcon_password VARCHAR(255),         -- Mật khẩu RCON (để tạm text, sau này mã hóa sau)
    is_active TINYINT(1) DEFAULT 1
);

-- 2. Bảng Matches: Đại diện cho 1 Series (BO1, BO3...)
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(20) NOT NULL,       -- Admin tạo phòng (FK tới users.id)
    server_id INT NOT NULL,             -- Đá ở server nào (FK tới servers.id)
    
    team1_name VARCHAR(20) NOT NULL DEFAULT 'Players',
    team2_name VARCHAR(20) NOT NULL DEFAULT 'Bots',
    
    series_type ENUM('BO1', 'BO3', 'BO5') NOT NULL,
    status ENUM('PENDING', 'VETO', 'LIVE', 'FINISHED', 'CANCELLED') DEFAULT 'PENDING',
    
    veto_log JSON DEFAULT NULL, -- lịch sử veto (Dạng JSON: [{"team":"TEAM1", "map":"de_mirage", "action":"BAN"}, ...])
    map_result VARCHAR(50) DEFAULT NULL, -- map kết quả cuối cùng
    
    winner_team VARCHAR(20),            -- 'team1' hoặc 'team2'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

CREATE TABLE IF NOT EXISTS match_participants (
    match_id INT NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    
    -- Vị trí của người chơi: TEAM1, TEAM2 hoặc SPECTATOR
    team ENUM('TEAM1', 'TEAM2', 'SPECTATOR') DEFAULT 'SPECTATOR',
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (match_id, user_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1. Tạo bảng maps
CREATE TABLE IF NOT EXISTS maps (
    map_key VARCHAR(50) PRIMARY KEY,  -- VD: de_mirage (Làm khóa chính luôn)
    display_name VARCHAR(50) NOT NULL,    -- VD: Mirage
    image_url TEXT,                       -- Link ảnh bìa map
    is_active TINYINT(1) DEFAULT 1        -- 1: Đang dùng thi đấu, 0: Tạm ẩn
);

CREATE TABLE IF NOT EXISTS match_maps (
    match_id INT NOT NULL,
    map_number INT NOT NULL,
    map_name VARCHAR(50) NOT NULL,
    status ENUM('PENDING', 'LIVE', 'FINISHED') DEFAULT 'PENDING',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    last_event_data JSON DEFAULT NULL,
    PRIMARY KEY (match_id, map_number),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- 2. Insert dữ liệu mẫu (7 Map Active Duty hiện tại)
INSERT INTO maps (map_key, display_name, image_url, is_active) VALUES
('de_ancient', 'Ancient', '/maps/de_ancient.png', 1),
('de_anubis', 'Anubis', '/maps/de_anubis.png', 0),
('de_dust2', 'Dust II', '/maps/de_dust2.jpg', 1),
('de_inferno', 'Inferno', '/maps/de_inferno.png', 1),
('de_mirage', 'Mirage', '/maps/de_mirage.png', 1),
('de_nuke', 'Nuke', '/maps/de_nuke.png', 1),
('de_overpass', 'Overpass', '/maps/de_overpass.png', 1),
('de_train', 'Train', '/maps/de_train.png', 1),
('de_vertigo', 'Vertigo', '/maps/de_vertigo.png', 0);

-- DỮ LIỆU MẪU (Để test): Tạo sẵn 1 server
INSERT INTO servers (display_name, ip, port, rcon_password) 
VALUES ('giORZang Server', 'giorzang.ddns.net', 27019, '2312');