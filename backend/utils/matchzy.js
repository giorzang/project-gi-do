const { Rcon } = require('rcon-client');

// 1. Hàm chuyển đổi dữ liệu DB -> JSON Matchzy
exports.generateMatchzyJSON = (match, participants, vetoLog, finalMap) => {
    // A. Phân loại người chơi vào các object
    // Format: { "steamid64": "Name", ... }
    const team1Players = {};
    const team2Players = {};
    const spectators = {};

    participants.forEach(p => {
        if (p.team === 'TEAM1') team1Players[p.user_id] = p.username;
        else if (p.team === 'TEAM2') team2Players[p.user_id] = p.username;
        else spectators[p.user_id] = p.username;
    });

    // B. Xử lý Maplist và Sides từ VetoLog
    // Logic: Lọc ra các map đã PICK. Map cuối cùng (finalMap) là Decider.
    let maplist = [];
    let map_sides = [];

    // Chỉ lấy các hành động PICK map (theo thứ tự thời gian)
    const pickedLogs = vetoLog.filter(l => l.action === 'PICK');

    pickedLogs.forEach(log => {
        maplist.push(log.map);

        // Tìm xem map này có hành động SIDE_PICK đi kèm không?
        const sideLog = vetoLog.find(l => l.action === 'SIDE_PICK' && l.map === log.map);

        if (sideLog) {
            // Format Matchzy: "team1_ct", "team1_t", "team2_ct", "team2_t"
            // sideLog.team là đội CHỌN side. sideLog.side là side họ chọn (CT/T).
            // Ví dụ: TEAM2 chọn CT -> "team2_ct"
            const sideString = `${sideLog.team.toLowerCase()}_${sideLog.side.toLowerCase()}`;
            map_sides.push(sideString);
        } else {
            // Fallback nếu không thấy log chọn side (mặc định knife)
            map_sides.push("knife");
        }
    });

    // Thêm Map Decider vào cuối
    if (finalMap) {
        maplist.push(finalMap);
        map_sides.push("knife"); // Map cuối luôn dao chọn bên
    }

    // C. Cấu trúc JSON hoàn chỉnh
    const numMaps = match.series_type === 'BO1' ? 1 : (match.series_type === 'BO3' ? 3 : 5);

    return {
        matchid: match.id,
        team1: {
            name: match.team1_name,
            players: team1Players
        },
        team2: {
            name: match.team2_name,
            players: team2Players
        },
        num_maps: numMaps,
        maplist: maplist,
        map_sides: map_sides,
        spectators: {
            players: spectators
        },
        clinch_series: true, // Có cho phép thắng sớm không (VD: BO3 thắng 2-0 là nghỉ)
        // players_per_team: 5,
        // min_players_to_ready: 1, // Để test thì để 1, thực tế nên là 5
        cvars: {
            "matchzy_remote_log_url": `http://${process.env.LOCAL_IP}:3000/api/matchzy/event`,
            //     "get5_check_auths": "1", // Bắt buộc check steamid
            //     "mp_overtime_enable": "1"
        }
    };
};

// 2. Hàm gửi RCON
exports.sendRconCommand = async (serverInfo, command) => {
    try {
        const rcon = new Rcon({
            // host: serverInfo.ip,
            host: process.env.LOCAL_IP,
            port: serverInfo.port,
            password: serverInfo.rcon_password
        });

        await rcon.connect();
        console.log(`🔌 RCON Connected to ${serverInfo.ip}:${serverInfo.port}`);

        const response = await rcon.send(command);
        console.log(`📤 Sent: ${command}`);
        console.log(`kiếm RCON Response: ${response}`);

        await rcon.end();
        return response;
    } catch (error) {
        console.error("❌ RCON Error:", error.message);
        throw error;
    }
};