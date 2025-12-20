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

        // 2. Lấy danh sách đội đã đăng ký
        const [teams] = await pool.execute(`
            SELECT t.id, t.name FROM tournament_teams t WHERE t.tournament_id = ?
        `, [id]);

        if (teams.length < 2) {
            return res.status(400).json({ message: "Cần ít nhất 2 đội để bắt đầu" });
        }

        // 3. Shuffle teams ngẫu nhiên
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

        // 4. Tính số vòng cần thiết (làm tròn lên lũy thừa 2)
        const teamCount = shuffledTeams.length;
        const nearestPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
        const totalRounds = Math.ceil(Math.log2(nearestPowerOf2));
        const firstRoundMatches = nearestPowerOf2 / 2;
        const byeCount = nearestPowerOf2 - teamCount; // Số đội được bye (đi thẳng vòng sau)

        const defaultServerId = 1;

        // 5. Tạo matches cho Round 1
        let teamIndex = 0;
        const round1Matches = [];

        for (let i = 0; i < firstRoundMatches; i++) {
            const team1 = shuffledTeams[teamIndex] || null;
            teamIndex++;
            const team2 = shuffledTeams[teamIndex] || null;
            teamIndex++;

            // Nếu 1 team null = bye, đội kia tự động thắng
            const isBye = !team1 || !team2;

            const match = await Match.create({
                display_name: totalRounds === 1 ? 'CHUNG KẾT' :
                    totalRounds === 2 ? `Bán kết ${i + 1}` :
                        totalRounds === 3 ? `Tứ kết ${i + 1}` :
                            `Vòng 1 - Trận ${i + 1}`,
                user_id: userId,
                server_id: defaultServerId,
                team1_name: team1 ? team1.name : 'BYE',
                team2_name: team2 ? team2.name : 'BYE',
                series_type: 'BO1',
                tournament_id: id,
                bracket_round: 1,
                bracket_match_index: i + 1,
                status: isBye ? 'FINISHED' : 'PENDING',
                winner_team: isBye ? (team1 ? 'team1' : 'team2') : null
            });
            round1Matches.push(match);
        }

        // 6. Tạo matches cho các vòng sau (TBD vs TBD)
        let matchesInRound = firstRoundMatches / 2;
        for (let round = 2; round <= totalRounds; round++) {
            const roundName = round === totalRounds ? 'CHUNG KẾT' :
                round === totalRounds - 1 ? 'Bán kết' :
                    round === totalRounds - 2 ? 'Tứ kết' :
                        `Vòng ${round}`;

            for (let i = 0; i < matchesInRound; i++) {
                await Match.create({
                    display_name: matchesInRound === 1 ? roundName : `${roundName} ${i + 1}`,
                    user_id: userId,
                    server_id: defaultServerId,
                    team1_name: 'TBD',
                    team2_name: 'TBD',
                    series_type: round === totalRounds ? 'BO3' : 'BO1',
                    tournament_id: id,
                    bracket_round: round,
                    bracket_match_index: i + 1
                });
            }
            matchesInRound = matchesInRound / 2;
        }

        await Tournament.updateStatus(id, 'ONGOING');
        res.json({
            message: `Giải đấu đã bắt đầu với ${teamCount} đội! Cây đấu ${totalRounds} vòng đã được tạo.`,
            teams: teamCount,
            rounds: totalRounds
        });

    } catch (error) {
        console.error("Start Tournament Error:", error);
        res.status(500).json({ message: "Lỗi server khi tạo Bracket" });
    }
};

// ==================== TOURNAMENT POSTS ====================

exports.getTournamentPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const [posts] = await pool.execute(`
            SELECT p.*, u.username, u.avatar_url
            FROM tournament_posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.tournament_id = ?
            ORDER BY p.created_at DESC
        `, [id]);
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createTournamentPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const authorId = req.user.uid;

        if (!title || !content) {
            return res.status(400).json({ message: "Thiếu tiêu đề hoặc nội dung" });
        }

        await pool.execute(`
            INSERT INTO tournament_posts (tournament_id, author_id, title, content)
            VALUES (?, ?, ?, ?)
        `, [id, authorId, title, content]);

        res.status(201).json({ message: "Đã đăng thông báo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.updateTournamentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        await pool.execute(`
            UPDATE tournament_posts SET title = ?, content = ? WHERE id = ?
        `, [title, content, postId]);

        res.json({ message: "Đã cập nhật thông báo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.deleteTournamentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        await pool.execute(`DELETE FROM tournament_posts WHERE id = ?`, [postId]);
        res.json({ message: "Đã xóa thông báo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// ==================== TOURNAMENT PARTICIPANTS ====================

exports.getTournamentParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        // Return empty array for now - participants table not yet created
        // Later: query tournament_participants table
        const [participants] = await pool.execute(`
            SELECT tp.*, u.username, u.avatar_url
            FROM tournament_participants tp
            LEFT JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = ?
            ORDER BY tp.registered_at ASC
        `, [id]).catch(() => [[]]);

        res.json(participants || []);
    } catch (error) {
        console.error(error);
        res.json([]); // Return empty if table doesn't exist
    }
};

// ==================== TOURNAMENT TEAMS ====================

exports.getTournamentTeams = async (req, res) => {
    try {
        const { id } = req.params;

        // Get all teams for this tournament
        const [teams] = await pool.execute(`
            SELECT t.*, u.username as captain_name, u.avatar_url as captain_avatar
            FROM tournament_teams t
            LEFT JOIN users u ON t.captain_id = u.id
            WHERE t.tournament_id = ?
            ORDER BY t.created_at ASC
        `, [id]);

        // For each team, get members and pending requests
        for (const team of teams) {
            const [members] = await pool.execute(`
                SELECT tm.*, u.username, u.avatar_url
                FROM tournament_team_members tm
                LEFT JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = ?
            `, [team.id]);
            team.members = members;

            const [requests] = await pool.execute(`
                SELECT jr.*, u.username, u.avatar_url
                FROM tournament_join_requests jr
                LEFT JOIN users u ON jr.user_id = u.id
                WHERE jr.team_id = ? AND jr.status = 'PENDING'
            `, [team.id]);
            team.pending_requests = requests;
        }

        res.json(teams);
    } catch (error) {
        console.error(error);
        res.json([]);
    }
};

exports.createTeam = async (req, res) => {
    try {
        const { id } = req.params; // tournament_id
        const { name } = req.body;
        const userId = req.user.uid;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Tên đội không được để trống" });
        }

        // Check if user already in a team for this tournament
        const [existing] = await pool.execute(`
            SELECT * FROM tournament_team_members tm
            JOIN tournament_teams t ON tm.team_id = t.id
            WHERE t.tournament_id = ? AND tm.user_id = ?
        `, [id, userId]);

        if (existing.length > 0) {
            return res.status(400).json({ message: "Bạn đã trong một đội rồi" });
        }

        // Create team
        const [result] = await pool.execute(`
            INSERT INTO tournament_teams (tournament_id, name, captain_id)
            VALUES (?, ?, ?)
        `, [id, name.trim(), userId]);

        const teamId = result.insertId;

        // Add captain as member
        await pool.execute(`
            INSERT INTO tournament_team_members (team_id, user_id, role)
            VALUES (?, ?, 'CAPTAIN')
        `, [teamId, userId]);

        res.status(201).json({ message: "Đã tạo đội thành công", teamId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.requestJoinTeam = async (req, res) => {
    try {
        const { id, teamId } = req.params;
        const userId = req.user.uid;

        // Check if user already in a team
        const [existing] = await pool.execute(`
            SELECT * FROM tournament_team_members tm
            JOIN tournament_teams t ON tm.team_id = t.id
            WHERE t.tournament_id = ? AND tm.user_id = ?
        `, [id, userId]);

        if (existing.length > 0) {
            return res.status(400).json({ message: "Bạn đã trong một đội rồi" });
        }

        // Check if already requested
        const [pendingReq] = await pool.execute(`
            SELECT * FROM tournament_join_requests
            WHERE team_id = ? AND user_id = ? AND status = 'PENDING'
        `, [teamId, userId]);

        if (pendingReq.length > 0) {
            return res.status(400).json({ message: "Bạn đã gửi yêu cầu rồi" });
        }

        await pool.execute(`
            INSERT INTO tournament_join_requests (team_id, user_id, status)
            VALUES (?, ?, 'PENDING')
        `, [teamId, userId]);

        res.json({ message: "Đã gửi yêu cầu tham gia" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.approveJoinRequest = async (req, res) => {
    try {
        const { teamId, requestId } = req.params;
        const userId = req.user.uid;

        // Verify captain
        const [team] = await pool.execute(`SELECT * FROM tournament_teams WHERE id = ? AND captain_id = ?`, [teamId, userId]);
        if (team.length === 0) {
            return res.status(403).json({ message: "Bạn không phải captain" });
        }

        // Get request
        const [request] = await pool.execute(`SELECT * FROM tournament_join_requests WHERE id = ?`, [requestId]);
        if (request.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }

        const requestUserId = request[0].user_id;

        // Add to team members
        await pool.execute(`
            INSERT INTO tournament_team_members (team_id, user_id, role)
            VALUES (?, ?, 'MEMBER')
        `, [teamId, requestUserId]);

        // Update request status
        await pool.execute(`UPDATE tournament_join_requests SET status = 'APPROVED' WHERE id = ?`, [requestId]);

        res.json({ message: "Đã duyệt thành viên" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.rejectJoinRequest = async (req, res) => {
    try {
        const { teamId, requestId } = req.params;
        const userId = req.user.uid;

        // Verify captain
        const [team] = await pool.execute(`SELECT * FROM tournament_teams WHERE id = ? AND captain_id = ?`, [teamId, userId]);
        if (team.length === 0) {
            return res.status(403).json({ message: "Bạn không phải captain" });
        }

        await pool.execute(`UPDATE tournament_join_requests SET status = 'REJECTED' WHERE id = ?`, [requestId]);

        res.json({ message: "Đã từ chối yêu cầu" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
