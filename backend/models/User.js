const pool = require('../config/database');

class User {
    static async findById(id) {
        const sql = 'SELECT id, username, avatar_url, is_admin FROM users WHERE id = ?';
        const [rows] = await pool.execute(sql, [id]);
        return rows[0];
    }

    static async updateUsername(id, newUsername) {
        const sql = 'UPDATE users SET username = ? WHERE id = ?';
        await pool.execute(sql, [newUsername, id]);
        return true;
    }

    // Có thể thêm các static method khác ở đây trong tương lai
    // ví dụ: findByUsername, create, etc.
}

module.exports = User;
