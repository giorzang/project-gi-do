const pool = require('../config/database');

class Map {
    /**
     * Lấy danh sách map đang active
     */
    static async findActive() {
        const sql = 'SELECT map_key, display_name, image_url FROM maps WHERE is_active = 1';
        const [rows] = await pool.execute(sql);
        return rows;
    }
}

module.exports = Map;
