const pool = require('../config/database');

class Tournament {
    static async create({ name, format, max_teams }) {
        const sql = `INSERT INTO tournaments (name, format, max_teams) VALUES (?, ?, ?)`;
        const [result] = await pool.execute(sql, [name, format, max_teams]);
        return result.insertId;
    }

    static async findAll() {
        const sql = `SELECT * FROM tournaments ORDER BY created_at DESC`;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    static async findById(id) {
        const sql = `SELECT * FROM tournaments WHERE id = ?`;
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    // Lấy danh sách trận đấu thuộc giải này
    static async getMatches(tournamentId) {
        const sql = `
            SELECT m.*, 
                   t1.username as team1_captain_name, 
                   t2.username as team2_captain_name
            FROM matches m
            LEFT JOIN users t1 ON m.captain1_id = t1.id
            LEFT JOIN users t2 ON m.captain2_id = t2.id
            WHERE m.tournament_id = ?
            ORDER BY m.bracket_round ASC, m.bracket_match_index ASC
        `;
        const [rows] = await pool.execute(sql, [tournamentId]);
        return rows;
    }

    static async updateStatus(id, status) {
        const sql = `UPDATE tournaments SET status = ? WHERE id = ?`;
        await pool.execute(sql, [status, id]);
    }
}

module.exports = Tournament;
