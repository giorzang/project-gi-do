const SteamStrategy = require('passport-steam').Strategy;
const pool = require('./database');

module.exports = function (passport) {
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    // Lấy URL từ biến môi trường, nếu không có thì fallback về localhost
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    passport.use(new SteamStrategy({
        returnURL: `${appUrl}/auth/steam/return`,
        realm: `${appUrl}/`,
        apiKey: process.env.STEAM_API_KEY
    },
        async function (identifier, profile, done) {
            try {
                const id = profile._json.steamid;
                const avatar_url = profile._json.avatarfull;

                // 1. Lưu hoặc Update User vào Database
                const sql = `
                INSERT INTO users (id, username, avatar_url)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                avatar_url = VALUES(avatar_url)
            `;
                await pool.execute(sql, [id, id, avatar_url]);

                // 2. Lấy Role hiện tại từ DB (Để nhét vào Token sau này)
                const [rows] = await pool.execute('SELECT username, is_admin FROM users WHERE id = ?', [id]);

                // Trả về object User gọn nhẹ
                const user = {
                    id: id,
                    username: rows[0].username,
                    avatar_url: avatar_url,
                    is_admin: rows[0].is_admin
                };

                return done(null, user);
            } catch (err) {
                console.error("Lỗi Passport Steam:", err);
                return done(err, null);
            }
        }));
};