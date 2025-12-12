const pool = require('../config/database');

class Match {
    /**
     * Tạo một match mới
     */
    static async create({ display_name, user_id, server_id, team1_name, team2_name, series_type }) {
        const sql = `
            INSERT INTO matches (display_name, user_id, server_id, team1_name, team2_name, series_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [display_name, user_id, server_id, team1_name, team2_name, series_type]);
        return result.insertId;
    }

    /**
     * Lấy tất cả các match (cho dashboard)
     */
    static async findAll() {
        const sql = `
            SELECT 
                m.*, 
                s.display_name as server_name, 
                s.ip, 
                s.port,
                COALESCE(SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(mm.last_event_data, '$.winner.team')) = 'team1' THEN 1 ELSE 0 END), 0) AS team1_series_score,
                COALESCE(SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(mm.last_event_data, '$.winner.team')) = 'team2' THEN 1 ELSE 0 END), 0) AS team2_series_score
            FROM matches m
            JOIN servers s ON m.server_id = s.id
            LEFT JOIN match_maps mm ON m.id = mm.match_id AND mm.status = 'FINISHED'
            GROUP BY m.id 
            ORDER BY m.created_at DESC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    /**
     * Lấy thông tin chi tiết một match bằng ID
     */
    static async findById(id) {
        const sql = `
            SELECT m.*, s.ip, s.port, u.username as admin_name
            FROM matches m
            JOIN servers s ON m.server_id = s.id
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `;
        const [rows] = await pool.execute(sql, [id]);
        const match = rows[0];
        if (match) {
            if (typeof match.veto_log === 'string') {
                try { match.veto_log = JSON.parse(match.veto_log); } catch (e) { match.veto_log = []; }
            }
            if (!Array.isArray(match.veto_log)) match.veto_log = [];
        }
        return match;
    }
    
    /**
     * Lấy thông tin cơ bản của match (dùng cho các check nhanh)
     */
    static async findBasicInfo(id) {
        const sql = 'SELECT * FROM matches WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    /**
     * Cập nhật trạng thái của match
     */
    static async updateStatus(id, status) {
        const sql = 'UPDATE matches SET status = ? WHERE id = ?';
        const [result] = await pool.execute(sql, [status, id]);
        return result.affectedRows > 0;
    }

    /**
     * Cập nhật log veto và status
     */
    static async updateVetoLog(id, vetoLog, status = 'VETO') {
        const sql = 'UPDATE matches SET veto_log = ?, status = ? WHERE id = ?';
        const [result] = await pool.execute(sql, [JSON.stringify(vetoLog), status, id]);
        return result.affectedRows > 0;
    }

    /**
     * Cập nhật map cuối cùng (decider) và status
     */
    static async updateMapResult(id, mapResult, status = 'LIVE') {
        const sql = 'UPDATE matches SET map_result = ?, status = ? WHERE id = ?';
        const [result] = await pool.execute(sql, [mapResult, status, id]);
        return result.affectedRows > 0;
    }

}

module.exports = Match;
