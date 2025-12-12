const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Xử lý sau khi Steam trả về thành công
exports.steamCallback = (req, res) => {
    // req.user đã có dữ liệu từ file passport.js trả về
    const user = req.user;

    // Tạo JWT Token
    const token = jwt.sign(
        {
            uid: user.id,
            role: user.is_admin
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Chuyển hướng về Frontend (React) kèm Token
    // Frontend sẽ lấy token này lưu vào localStorage
    // Redirect về root (/) vì backend đang serve frontend
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.redirect(`${appUrl}/?token=${token}`);
};

// API lấy thông tin User hiện tại (Me)
exports.getMe = async (req, res) => {
    try {
        // req.user ở đây do middleware giải mã token, chỉ chứa { uid, isAdmin }
        const userId = req.user.uid;

        // Query DB để lấy thông tin đầy đủ (Tên, Avatar)
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        // Trả về user đầy đủ
        res.json({
            authenticated: true,
            user: {
                id: user.id,
                username: user.username,
                avatar_url: user.avatar_url,
                is_admin: user.is_admin // MySQL trả về 0 hoặc 1
            }
        });
    } catch (error) {
        console.error("Lỗi getMe:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// API cập nhật thông tin user
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { username } = req.body;

        if (!username || username.trim().length === 0) {
            return res.status(400).json({ message: "Username không được để trống" });
        }

        if (username.length > 32) {
            return res.status(400).json({ message: "Username quá dài (max 32 ký tự)" });
        }

        await User.updateUsername(userId, username);

        res.json({ message: "Cập nhật thành công", username });
    } catch (error) {
        console.error("Lỗi updateProfile:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};