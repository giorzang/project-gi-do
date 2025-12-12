const pool = require('../config/database');

class Server {
    /**
     * Lấy tất cả các server đang active
     */
    static async findActive() {
        const sql = 'SELECT id, display_name, ip, port FROM servers WHERE is_active = 1';
        const [rows] = await pool.execute(sql);
        return rows;
    }

    /**
     * Tìm một server bằng ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM servers WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }
}

module.exports = Server;
