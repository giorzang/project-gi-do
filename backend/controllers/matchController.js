const Match = require('../models/Match');
const Server = require('../models/Server');
const MatchParticipant = require('../models/MatchParticipant');
const Map = require('../models/Map');
const pool = require('../config/database');
const { getIo } = require('../socket/socketManager');
const { generateMatchzyJSON, sendRconCommand } = require('../utils/matchzy');

// API: Tạo Match mới
exports.createMatch = async (req, res) => {
    try {
        const { display_name, team1_name, team2_name, server_id, series_type } = req.body;
        const user_id = req.user.uid;

        if (!display_name || !team1_name || !team2_name || !server_id || !series_type) {
            return res.status(400).json({ message: "Vui lòng nhập đủ tên 2 team và chọn server" });
        }

        const server = await Server.findById(server_id);
        if (!server) {
            return res.status(404).json({ message: "Server không tồn tại" });
        }

        const matchId = await Match.create({ display_name, user_id, server_id, team1_name, team2_name, series_type });

        res.status(201).json({
            message: "Tạo phòng thành công",
            matchId: matchId,
            matchData: {
                display_name, team1_name, team2_name, series_type, status: 'PENDING'
            }
        });

    } catch (error) {
        console.error("Lỗi tạo match:", error);
        res.status(500).json({ message: "Lỗi server khi tạo match" });
    }
};

// API: Lấy danh sách Match
exports.getAllMatches = async (req, res) => {
    try {
        const matches = await Match.findAll();
        res.json(matches);
    } catch (error) {
        console.error("Lỗi lấy danh sách match:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// API: Lấy chi tiết Match
exports.getMatchDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await Match.findById(id);
        if (!match) return res.status(404).json({ message: "Match not found" });

        const participants = await MatchParticipant.findByMatchId(id);

        res.json({
            ...match,
            participants: participants
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// API: Tham gia hoặc Đổi Slot
exports.joinSlot = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;
        const { team } = req.body;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        if (match.status !== 'PENDING') {
            return res.status(400).json({ message: "Trận đấu đang diễn ra hoặc đã kết thúc, không thể thay đổi vị trí!" });
        }

        if (!['TEAM1', 'TEAM2', 'SPECTATOR'].includes(team)) {
            return res.status(400).json({ message: "Team không hợp lệ" });
        }

        if (team !== 'SPECTATOR') {
            const count = await MatchParticipant.countByTeam(matchId, team);
            if (count >= 5) {
                return res.status(400).json({ message: "Team này đã đủ 5 người!" });
            }
        }

        await MatchParticipant.upsert(matchId, userId, team);

        const newList = await MatchParticipant.findByMatchId(matchId);
        getIo().to(`match_${matchId}`).emit('participants_update', newList);

        res.json({ message: "Join thành công", participants: newList });

    } catch (error) {
        console.error("Join Error:", error);
        res.status(500).json({ message: "Lỗi khi tham gia trận đấu" });
    }
};

// API: Rời trận đấu
exports.leaveMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        if (match.status !== 'PENDING') {
            return res.status(400).json({ message: "Không thể rời phòng khi trận đấu đang diễn ra!" });
        }

        await MatchParticipant.remove(matchId, userId);

        const newList = await MatchParticipant.findByMatchId(matchId);
        getIo().to(`match_${matchId}`).emit('participants_update', newList);

        res.json({ message: "Đã rời trận đấu" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// API: Lấy danh sách Server
exports.getServers = async (req, res) => {
    try {
        const servers = await Server.findActive();
        res.json(servers);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách server" });
    }
};

const calculateState = (vetoLog, seriesType) => {
    const mapActions = vetoLog.filter(l => l.action === 'BAN' || l.action === 'PICK');
    const lastAction = vetoLog[vetoLog.length - 1];

    if (lastAction && lastAction.action === 'PICK') {
        const nextTeam = lastAction.team === 'TEAM1' ? 'TEAM2' : 'TEAM1';
        return { turn: nextTeam, type: 'SIDE_PICK', mapRef: lastAction.map };
    }

    const turnIndex = mapActions.length;

    if (seriesType === 'BO1') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        return { turn: turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2', type: 'BAN' };
    }

    if (seriesType === 'BO3') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        const team = turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2';
        if (turnIndex < 2) return { turn: team, type: 'BAN' };
        if (turnIndex < 4) return { turn: team, type: 'PICK' };
        return { turn: team, type: 'BAN' };
    }
    if (seriesType === 'BO5') {
        if (turnIndex >= 6) return { turn: 'FINISHED', type: 'NONE' };
        const team = turnIndex % 2 === 0 ? 'TEAM1' : 'TEAM2';
        if (turnIndex < 2) return { turn: team, type: 'BAN' };
        return { turn: team, type: 'PICK' };
    }

    return { turn: 'TEAM1', type: 'BAN' };
};

// API: Lấy danh sách Map Active
exports.getMapPool = async (req, res) => {
    try {
        const maps = await Map.findActive();
        res.json(maps);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy Map Pool" });
    }
};

// API: Config Matchzy
exports.getMatchConfig = async (req, res) => {
    try {
        const matchId = req.params.id;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ error: "Match not found" });

        const participants = await MatchParticipant.findByMatchId(matchId);

        let vetoLog = match.veto_log || [];
        if (typeof vetoLog === 'string') {
            try { vetoLog = JSON.parse(vetoLog); } catch (e) { vetoLog = []; }
        }

        const config = generateMatchzyJSON(match, participants, vetoLog, match.map_result);
        res.json(config);

    } catch (error) {
        console.error("Config Generation Error:", error);
        res.status(500).json({ error: "Failed to generate config" });
    }
};

// API: Veto Map
exports.vetoMap = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;
        const { mapName, side } = req.body;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        let vetoLog = match.veto_log || [];
        if (typeof vetoLog === 'string') vetoLog = JSON.parse(vetoLog);

        if (match.status === 'FINISHED') return res.status(400).json({ message: "Ended" });

        const state = calculateState(vetoLog, match.series_type);
        if (state.turn === 'FINISHED') return res.status(400).json({ message: "Veto finished" });

        const participant = await MatchParticipant.findOne(matchId, userId);
        if (!participant) return res.status(403).json({ message: "Bạn không tham gia" });

        const userTeam = participant.team;
        if (userTeam !== state.turn) return res.status(403).json({ message: `Chưa đến lượt của bạn (${state.turn})` });

        if (state.type === 'SIDE_PICK') {
            if (!side || !['CT', 'T'].includes(side)) {
                return res.status(400).json({ message: "Vui lòng chọn side (CT hoặc T)" });
            }
            vetoLog.push({ team: userTeam, action: 'SIDE_PICK', map: state.mapRef, side: side, time: new Date().toISOString() });
        }
        else {
            if (!mapName) return res.status(400).json({ message: "Vui lòng chọn Map" });

            const activePool = (await Map.findActive()).map(m => m.map_key);
            if (!activePool.includes(mapName)) return res.status(400).json({ message: "Map invalid" });

            if (vetoLog.some(l => l.map === mapName && (l.action === 'BAN' || l.action === 'PICK'))) {
                return res.status(400).json({ message: "Map đã được chọn" });
            }

            vetoLog.push({ team: userTeam, map: mapName, action: state.type, time: new Date().toISOString() });
        }

        await Match.updateVetoLog(matchId, vetoLog, 'VETO');

        const nextState = calculateState(vetoLog, match.series_type);
        let finalMap = null;
        let matchResultStatus = 'VETO';

        if (nextState.turn === 'FINISHED') {
            matchResultStatus = 'LIVE';

            const mapActions = vetoLog.filter(l => l.action === 'BAN' || l.action === 'PICK');
            const usedMaps = mapActions.map(l => l.map);
            const fullPool = (await Map.findActive()).map(m => m.map_key);
            finalMap = fullPool.find(m => !usedMaps.includes(m));

            if (finalMap) {
                await Match.updateMapResult(matchId, finalMap, 'LIVE');

                // --- INSERT MAPS INTO match_maps ---
                const pickedMaps = vetoLog.filter(l => l.action === 'PICK').map(l => l.map);
                const mapsToPlay = [...pickedMaps, finalMap];

                // Xóa maps cũ của match này nếu có (để tránh duplicate)
                await pool.execute('DELETE FROM match_maps WHERE match_id = ?', [matchId]);

                const mapValues = mapsToPlay.map((mapName, index) => [
                    matchId, 
                    index + 1, 
                    mapName, 
                    index === 0 ? 'LIVE' : 'PENDING' // Map đầu tiên LIVE, còn lại PENDING
                ]);
                
                if (mapValues.length > 0) {
                    await pool.query('INSERT INTO match_maps (match_id, map_number, map_name, status) VALUES ?', [mapValues]);
                }
                // -----------------------------------

                // --- CLEANUP OLD STATS BEFORE START ---
                try {
                    // matchzy_stats tables are deleted, no need to clean up.
                } catch (cleanupErr) {
                    console.warn("⚠️ Stats cleanup warning:", cleanupErr.message);
                }
                // --------------------------------------

                const server = await Server.findById(match.server_id);
                if (server) {
                    const protocol = req.protocol;
                    const host = process.env.LOCAL_IP || 'http://localhost:3000';
                    const configUrl = `${protocol}://${host}:3000/api/matches/${matchId}/config`;

                    console.log(`🚀 Triggering Matchzy load for Match #${matchId}`);
                    sendRconCommand(server, `matchzy_loadmatch_url "${configUrl}"`)
                        .catch(err => console.error("❌ Failed to load match via RCON (Background):", err.message));
                }
            }
        }

        const updateData = { vetoLog, status: matchResultStatus, mapResult: finalMap, nextState: nextState };
        getIo().to(`match_${matchId}`).emit('veto_update', updateData);

        res.json({ message: "Success", data: updateData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// API: Admin bắt đầu trận đấu
exports.startMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        if (String(match.user_id) !== String(userId)) {
            return res.status(403).json({ message: "Chỉ chủ phòng mới được bắt đầu!" });
        }

        await Match.updateStatus(matchId, 'VETO');

        getIo().to(`match_${matchId}`).emit('veto_update', { status: 'VETO', vetoLog: [] });

        res.json({ message: "Trận đấu đã bắt đầu!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// API: Hủy trận đấu (Admin)
exports.cancelMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        if (String(match.user_id) !== String(userId)) {
            return res.status(403).json({ message: "Chỉ chủ phòng mới được hủy trận!" });
        }

        // 1. Gửi RCON forceend nếu server online (không bắt buộc phải thành công)
        const server = await Server.findById(match.server_id);
        if (server) {
            try {
                await sendRconCommand(server, "css_forceend");
                console.log(`Sent css_forceend to server for match ${matchId}`);
            } catch (err) {
                console.warn(`Could not send RCON cancel command: ${err.message}`);
            }
        }

        // 2. Cập nhật DB thành CANCELLED
        await Match.updateStatus(matchId, 'CANCELLED');

        // 3. Thông báo Socket
        getIo().to(`match_${matchId}`).emit('veto_update', { status: 'CANCELLED' });

        res.json({ message: "Đã hủy trận đấu thành công" });

    } catch (error) {
        console.error("Cancel Match Error:", error);
        res.status(500).json({ message: "Lỗi server khi hủy trận" });
    }
};

// API: GỬI RCON
exports.sendMatchRcon = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.uid;
        const { command } = req.body;

        if (!command) return res.status(400).json({ message: "Vui lòng nhập lệnh" });

        const match = await Match.findBasicInfo(matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        if (String(match.user_id) !== String(userId)) {
            return res.status(403).json({ message: "Chỉ chủ phòng mới được dùng RCON!" });
        }

        const server = await Server.findById(match.server_id);
        if (!server) return res.status(404).json({ message: "Server not found" });

        const rconResponse = await sendRconCommand(server, command);
        res.json({ message: "Gửi thành công", response: rconResponse });

    } catch (error) {
        console.error("RCON API Error:", error);
        res.status(500).json({ message: "Lỗi kết nối RCON: " + error.message });
    }
};

// --- API: Lấy thống kê chi tiết trận đấu (Post-Match) ---
exports.getMatchStats = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Lấy thông tin chung trận đấu
        const match = await Match.findById(id);
        if (!match) return res.status(404).json({ message: "Match not found" });

        // 2. Lấy danh sách Map đã đấu từ match_maps
        const [maps] = await pool.execute(
            `SELECT * FROM match_maps WHERE match_id = ? ORDER BY map_number ASC`,
            [id]
        );

        // 3. Với mỗi map, lấy stats người chơi
        const mapsWithStats = await Promise.all(maps.map(async (map) => {
            let playerStats = [];
            let loadedFromJSON = false;

            // ƯU TIÊN 1: Lấy từ cột JSON last_event_data (chứa full stats KAST, BP, BD...)
            if (map.last_event_data) {
                try {
                    const event = (typeof map.last_event_data === 'string')
                        ? JSON.parse(map.last_event_data)
                        : map.last_event_data;

                    // Extract Scores from JSON (Fallback for removed DB columns)
                    if (event.event === 'map_end' || event.event === 'map_result') {
                        // map_end often has flat scores, map_result has nested team objects. 
                        // We check nested first as it's more common in MatchZy 'map_result'
                        if (event.team1 && event.team1.score !== undefined) map.score_team1 = event.team1.score;
                        else if (event.team1_score !== undefined) map.score_team1 = event.team1_score;

                        if (event.team2 && event.team2.score !== undefined) map.score_team2 = event.team2.score;
                        else if (event.team2_score !== undefined) map.score_team2 = event.team2_score;
                    } else {
                        // round_end or others
                        if (event.team1 && event.team1.score !== undefined) map.score_team1 = event.team1.score;
                        if (event.team2 && event.team2.score !== undefined) map.score_team2 = event.team2.score;
                    }

                    // Helper parse giống bên matchzyController
                    const processPlayers = (teamPlayers, teamName, teamSide) => {
                        if (!teamPlayers || !Array.isArray(teamPlayers)) return [];
                        return teamPlayers.map(p => ({
                            steamid64: p.steamid,
                            name: p.name,
                            team: teamName,
                            side: teamSide,
                            kills: p.stats.kills,
                            deaths: p.stats.deaths,
                            assists: p.stats.assists,
                            flash_assists: p.stats.flash_assists,
                            team_kills: p.stats.team_kills,
                            suicides: p.stats.suicides,
                            damage: p.stats.damage,
                            utility_damage: p.stats.utility_damage,
                            enemies_flashed: p.stats.enemies_flashed,
                            friendlies_flashed: p.stats.friendlies_flashed,
                            knife_kills: p.stats.knife_kills,
                            headshot_kills: p.stats.headshot_kills,
                            head_shot_kills: p.stats.headshot_kills, // Alias for frontend
                            rounds_played: p.stats.rounds_played,
                            bomb_defuses: p.stats.bomb_defuses,
                            bomb_plants: p.stats.bomb_plants,
                            '1k': p.stats['1k'],
                            '2k': p.stats['2k'],
                            '3k': p.stats['3k'],
                            '4k': p.stats['4k'],
                            '5k': p.stats['5k'],
                            enemy2ks: p.stats['2k'], // Alias for frontend
                            enemy3ks: p.stats['3k'], // Alias for frontend
                            enemy4ks: p.stats['4k'], // Alias for frontend
                            enemy5ks: p.stats['5k'], // Alias for frontend
                            '1v1': p.stats['1v1'],
                            '1v2': p.stats['1v2'],
                            '1v3': p.stats['1v3'],
                            '1v4': p.stats['1v4'],
                            '1v5': p.stats['1v5'],
                            v1: p.stats['1v1'], // Alias
                            v2: p.stats['1v2'], // Alias
                            v3: p.stats['1v3'], // Alias
                            v4: p.stats['1v4'], // Alias
                            v5: p.stats['1v5'], // Alias
                            first_kills_t: p.stats.first_kills_t,
                            first_kills_ct: p.stats.first_kills_ct,
                            first_deaths_t: p.stats.first_deaths_t,
                            first_deaths_ct: p.stats.first_deaths_ct,
                            trade_kills: p.stats.trade_kills,
                            kast: p.stats.kast,
                            score: p.stats.score,
                            mvp: p.stats.mvp
                        }));
                    };

                    // Check cấu trúc event (round_end vs map_end)
                    // round_end: event.team1.players
                    // map_end: thường cũng có team1.players hoặc tương tự
                    const t1 = event.team1 ? event.team1 : null;
                    const t2 = event.team2 ? event.team2 : null;

                    if (t1 && t2 && t1.players && t2.players) {
                        const s1 = processPlayers(t1.players, t1.name, t1.side);
                        const s2 = processPlayers(t2.players, t2.name, t2.side);
                        playerStats = [...s1, ...s2];
                        if (playerStats.length > 0) loadedFromJSON = true;
                    }
                } catch (err) {
                    console.warn(`⚠️ Failed to parse last_event_data for match ${id} map ${map.map_number}:`, err.message);
                }
            }

            // ƯU TIÊN 2: Nếu không có JSON, fallback về DB cũ (ĐÃ BỊ XÓA -> Trả về rỗng)
            if (!loadedFromJSON) {
               // matchzy_stats tables are deleted. Return empty if no JSON data.
               playerStats = [];
            }

            return {
                ...map,
                player_stats: playerStats
            };
        }));

        res.json({
            match_info: match,
            maps: mapsWithStats
        });

    } catch (error) {
        console.error("Get Match Stats Error:", error);
        res.status(500).json({ message: "Lỗi lấy thống kê trận đấu" });
    }
};