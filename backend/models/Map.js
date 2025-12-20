const pool = require('../config/database');

class Map {
    /**
     * Lấy danh sách map đang active (có is_competitive=1 OR is_wingman=1)
     */
    static async findActive() {
        const sql = 'SELECT map_key, display_name, image_url, is_competitive, is_wingman FROM maps WHERE is_competitive = 1 OR is_wingman = 1';
        const [rows] = await pool.execute(sql);
        return rows;
    }

    /**
     * Lấy danh sách map đang active theo game mode (competitive/wingman)
     */
    static async findActiveByGameMode(gameMode = 'competitive') {
        const column = gameMode === 'wingman' ? 'is_wingman' : 'is_competitive';
        const sql = `SELECT map_key, display_name, image_url FROM maps WHERE ${column} = 1`;
        const [rows] = await pool.execute(sql);
        return rows;
    }
}

module.exports = Map;
