const axios = require('axios');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

exports.sendMatchCreated = async (matchId, matchData) => {
    if (!WEBHOOK_URL) {
        console.warn("DISCORD_WEBHOOK_URL không được cấu hình trong .env. Bỏ qua gửi Discord.");
        return;
    }
    
    // Đảm bảo matchData có đủ thông tin cần thiết
    const display_name = matchData.display_name || "Trận đấu mới";
    const series_type = matchData.series_type || "BO1";
    const map_info = matchData.is_veto_enabled === 1 ? "Veto" : (matchData.pre_selected_maps && matchData.pre_selected_maps.length > 0 ? matchData.pre_selected_maps.join(', ') : "Chưa chọn");
    const app_url = process.env.APP_URL || 'http://localhost:3000';

    const embed = {
        title: "🔥 Trận đấu mới đang tìm người!",
        description: `**[${display_name}](${app_url}/matches/${matchId})**`,
        color: 16744192, // Màu Cam (decimal của #FF8C00)
        fields: [
            { name: "Thể thức", value: series_type, inline: true },
            { name: "Map", value: map_info, inline: true },
            { name: "Tham gia ngay", value: `[Link](${app_url}/matches/${matchId})` }
        ],
        timestamp: new Date(),
        footer: { text: "CS2 Manager Bot" }
    };

    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        console.log("✅ Đã gửi thông báo Discord về trận đấu mới.");
    } catch (e) {
        console.error("❌ Discord Webhook Error:", e.response?.data || e.message);
    }
};
