const pool = require('../config/database');

class MatchParticipant {
    /**
     * Lấy tất cả người tham gia của một match
     */
    static async findByMatchId(matchId) {
        const sql = `
            SELECT p.*, u.username, u.avatar_url, u.id as steamid
            FROM match_participants p
            JOIN users u ON p.user_id = u.id
            WHERE p.match_id = ?
        `;
        const [rows] = await pool.execute(sql, [matchId]);
        return rows;
    }

    /**
     * Lấy thông tin của một người tham gia cụ thể trong match
     */
    static async findOne(matchId, userId) {
        const sql = 'SELECT team FROM match_participants WHERE match_id = ? AND user_id = ?';
        const [rows] = await pool.execute(sql, [matchId, userId]);
        return rows[0];
    }
    
    /**
     * Đếm số người trong một team của match
     */
    static async countByTeam(matchId, team) {
        const sql = 'SELECT COUNT(*) as count FROM match_participants WHERE match_id = ? AND team = ?';
        const [rows] = await pool.execute(sql, [matchId, team]);
        return rows[0].count;
    }

    /**
     * Thêm hoặc cập nhật vị trí của người chơi trong match (UPSERT)
     */
    static async upsert(matchId, userId, team) {
        const sql = `
            INSERT INTO match_participants (match_id, user_id, team)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE team = VALUES(team)
        `;
        const [result] = await pool.execute(sql, [matchId, userId, team]);
        return result;
    }

    /**
     * Xóa người chơi khỏi match
     */
    static async remove(matchId, userId) {
        const sql = 'DELETE FROM match_participants WHERE match_id = ? AND user_id = ?';
        const [result] = await pool.execute(sql, [matchId, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = MatchParticipant;
