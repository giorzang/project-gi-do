const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const pool = require('../config/database');

exports.createTournament = async (req, res) => {
    try {
        const { name, format, max_teams } = req.body;
        if (!name) return res.status(400).json({ message: "Thiếu tên giải đấu" });

        const id = await Tournament.create({ name, format, max_teams: max_teams || 8 });
        res.status(201).json({ message: "Tạo giải thành công", id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.getAllTournaments = async (req, res) => {
    try {
        const list = await Tournament.findAll();
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.getTournamentDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ message: "Không tìm thấy giải đấu" });

        const matches = await Tournament.getMatches(id);
        res.json({ ...tournament, matches });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// API: Bắt đầu giải đấu (Sinh Bracket)
exports.startTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        // 1. Lấy thông tin giải
        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ message: "Not found" });
        if (tournament.status !== 'REGISTRATION') return res.status(400).json({ message: "Giải đã bắt đầu hoặc kết thúc" });

        // 2. Sinh Bracket (Cố định cho 8 teams - Single Elimination)
        // Tạo Placeholder Matches
        const defaultServerId = 1; // Server mặc định, sau này Admin vào Settings từng match để sửa lại server thật

        // Round 1 (Tứ kết): 4 trận
        for (let i = 1; i <= 4; i++) {
            await Match.create({
                display_name: `Tứ kết ${i}`,
                user_id: userId,
                server_id: defaultServerId,
                team1_name: 'Team A', // Placeholder
                team2_name: 'Team B',
                series_type: 'BO1',
                tournament_id: id,
                bracket_round: 1,
                bracket_match_index: i
            });
        }

        // Round 2 (Bán kết): 2 trận
        for (let i = 1; i <= 2; i++) {
            await Match.create({
                display_name: `Bán kết ${i}`,
                user_id: userId,
                server_id: defaultServerId,
                team1_name: 'TBD',
                team2_name: 'TBD',
                series_type: 'BO3',
                tournament_id: id,
                bracket_round: 2,
                bracket_match_index: i
            });
        }

        // Round 3 (Chung kết): 1 trận
        await Match.create({
            display_name: `CHUNG KẾT`,
            user_id: userId,
            server_id: defaultServerId,
            team1_name: 'TBD',
            team2_name: 'TBD',
            series_type: 'BO3',
            tournament_id: id,
            bracket_round: 3,
            bracket_match_index: 1
        });

        await Tournament.updateStatus(id, 'ONGOING');
        res.json({ message: "Giải đấu đã bắt đầu! Cây đấu đã được tạo." });

    } catch (error) {
        console.error("Start Tournament Error:", error);
        res.status(500).json({ message: "Lỗi server khi tạo Bracket" });
    }
};
