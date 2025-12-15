const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Chỉ cho phép user đã đăng nhập upload
router.post('/', verifyToken, uploadController.uploader.single('image'), uploadController.uploadImage);

module.exports = router;
