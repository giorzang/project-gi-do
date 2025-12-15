const pool = require('../config/database');

// API: Lấy danh sách tất cả users kèm thống kê
exports.getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.id, 
                u.username, 
                u.avatar_url,
                COUNT(m.id) as total_matches,
                SUM(CASE 
                    WHEN mp.team = 'TEAM1' AND m.winner_team = 'team1' THEN 1
                    WHEN mp.team = 'TEAM2' AND m.winner_team = 'team2' THEN 1
                    ELSE 0 
                END) as total_wins
            FROM users u
            LEFT JOIN match_participants mp ON u.id = mp.user_id
            LEFT JOIN matches m ON mp.match_id = m.id AND m.status = 'FINISHED'
            GROUP BY u.id
            ORDER BY total_matches DESC
        `;

        const [users] = await pool.execute(sql);

        // Convert stats to numbers (count/sum returns string/decimal sometimes)
        const formattedUsers = users.map(user => ({
            ...user,
            total_matches: Number(user.total_matches),
            total_wins: Number(user.total_wins)
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
