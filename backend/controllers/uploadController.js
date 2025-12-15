const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        // Tên file = timestamp + extension (để tránh trùng)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Bộ lọc file (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được upload file ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

// API Handler
exports.uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Vui lòng chọn file ảnh" });
    }

    // Trả về đường dẫn ảnh (Relative URL)
    // Client sẽ gọi http://domain.com/uploads/filename.jpg
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
        message: "Upload thành công", 
        url: imageUrl 
    });
};

// Middleware export để dùng trong router
exports.uploader = upload;
