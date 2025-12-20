const pool = require('../config/database');
const { sendRconCommand } = require('../utils/matchzy');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ totalMatches }]] = await pool.execute('SELECT COUNT(*) as totalMatches FROM matches');
        const [[{ liveMatches }]] = await pool.execute("SELECT COUNT(*) as liveMatches FROM matches WHERE status = 'LIVE'");
        const [[{ ongoingTournaments }]] = await pool.execute("SELECT COUNT(*) as ongoingTournaments FROM tournaments WHERE status = 'ONGOING'");
        const [[{ newUsersThisWeek }]] = await pool.execute("SELECT COUNT(*) as newUsersThisWeek FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");

        res.json({
            totalUsers,
            totalMatches,
            liveMatches,
            ongoingTournaments,
            newUsersThisWeek
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Lỗi lấy thống kê' });
    }
};

// ========== USERS ==========

// GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT id, username, avatar_url, is_admin, is_banned, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách users' });
    }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_admin } = req.body;

        await pool.execute('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật quyền' });
    }
};

// PUT /api/admin/users/:id/ban
exports.updateUserBan = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_banned } = req.body;

        await pool.execute('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned ? 1 : 0, id]);
        res.json({ message: is_banned ? 'Đã ban user' : 'Đã unban user' });
    } catch (error) {
        console.error('Update Ban Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái ban' });
    }
};

// ========== SERVERS ==========

// GET /api/admin/servers
exports.getServers = async (req, res) => {
    try {
        const [servers] = await pool.execute('SELECT * FROM servers ORDER BY id DESC');
        res.json(servers);
    } catch (error) {
        console.error('Get Servers Error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách servers' });
    }
};

// POST /api/admin/servers
exports.createServer = async (req, res) => {
    try {
        const { display_name, ip, port, rcon_password, is_active } = req.body;

        if (!display_name || !ip || !port) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        await pool.execute(
            'INSERT INTO servers (display_name, ip, port, rcon_password, is_active) VALUES (?, ?, ?, ?, ?)',
            [display_name, ip, port, rcon_password || '', is_active ?? 1]
        );

        res.status(201).json({ message: 'Tạo server thành công' });
    } catch (error) {
        console.error('Create Server Error:', error);
        res.status(500).json({ message: 'Lỗi tạo server' });
    }
};

// PUT /api/admin/servers/:id
exports.updateServer = async (req, res) => {
    try {
        const { id } = req.params;
        const { display_name, ip, port, rcon_password, is_active } = req.body;

        let sql = 'UPDATE servers SET ';
        const updates = [];
        const params = [];

        if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
        if (ip !== undefined) { updates.push('ip = ?'); params.push(ip); }
        if (port !== undefined) { updates.push('port = ?'); params.push(port); }
        if (rcon_password !== undefined) { updates.push('rcon_password = ?'); params.push(rcon_password); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Không có gì để cập nhật' });
        }

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await pool.execute(sql, params);
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update Server Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật server' });
    }
};

// DELETE /api/admin/servers/:id
exports.deleteServer = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM servers WHERE id = ?', [id]);
        res.json({ message: 'Xóa server thành công' });
    } catch (error) {
        console.error('Delete Server Error:', error);
        res.status(500).json({ message: 'Lỗi xóa server' });
    }
};

// POST /api/admin/servers/:id/test-rcon
exports.testServerRcon = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM servers WHERE id = ?', [id]);
        const server = rows[0];

        if (!server) {
            return res.status(404).json({ message: 'Server không tồn tại' });
        }

        const response = await sendRconCommand(server, 'status');
        res.json({ message: 'Kết nối RCON thành công!', response });
    } catch (error) {
        console.error('Test RCON Error:', error);
        res.status(500).json({ message: 'Kết nối RCON thất bại: ' + error.message });
    }
};

// ========== MAPS ==========

// GET /api/admin/maps
exports.getMaps = async (req, res) => {
    try {
        const [maps] = await pool.execute('SELECT * FROM maps ORDER BY map_key ASC');
        res.json(maps);
    } catch (error) {
        console.error('Get Maps Error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách maps' });
    }
};

// POST /api/admin/maps
exports.createMap = async (req, res) => {
    try {
        const { map_key, display_name, image_url, is_competitive, is_wingman } = req.body;

        if (!map_key || !display_name) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
        }

        await pool.execute(
            'INSERT INTO maps (map_key, display_name, image_url, is_competitive, is_wingman) VALUES (?, ?, ?, ?, ?)',
            [map_key, display_name, image_url || '', is_competitive ?? 1, is_wingman ?? 0]
        );

        res.status(201).json({ message: 'Tạo map thành công' });
    } catch (error) {
        console.error('Create Map Error:', error);
        res.status(500).json({ message: 'Lỗi tạo map' });
    }
};

// PUT /api/admin/maps/:map_key
exports.updateMap = async (req, res) => {
    try {
        const { map_key } = req.params;
        const { display_name, image_url, is_competitive, is_wingman } = req.body;

        let sql = 'UPDATE maps SET ';
        const updates = [];
        const params = [];

        if (display_name !== undefined) { updates.push('display_name = ?'); params.push(display_name); }
        if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
        if (is_competitive !== undefined) { updates.push('is_competitive = ?'); params.push(is_competitive); }
        if (is_wingman !== undefined) { updates.push('is_wingman = ?'); params.push(is_wingman); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Không có gì để cập nhật' });
        }

        sql += updates.join(', ') + ' WHERE map_key = ?';
        params.push(map_key);

        await pool.execute(sql, params);
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update Map Error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật map' });
    }
};

// DELETE /api/admin/maps/:map_key
exports.deleteMap = async (req, res) => {
    try {
        const { map_key } = req.params;
        await pool.execute('DELETE FROM maps WHERE map_key = ?', [map_key]);
        res.json({ message: 'Xóa map thành công' });
    } catch (error) {
        console.error('Delete Map Error:', error);
        res.status(500).json({ message: 'Lỗi xóa map' });
    }
};
