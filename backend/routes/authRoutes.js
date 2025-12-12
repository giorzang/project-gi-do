const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// 1. Route kích hoạt đăng nhập Steam
router.get('/steam', passport.authenticate('steam'));

// 2. Route Steam trả về (Callback)
router.get('/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/' }),
    authController.steamCallback
);

// 3. API lấy thông tin User (Được bảo vệ bởi verifyToken)
router.get('/me', verifyToken, authController.getMe);

// 4. API cập nhật thông tin User
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;