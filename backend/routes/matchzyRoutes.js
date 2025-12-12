const express = require('express');
const router = express.Router();
const matchzyController = require('../controllers/matchzyController');

// Tuyến đường nhận tất cả các sự kiện từ MatchZy webhook
router.post('/event', matchzyController.handleMatchzyEvent);

module.exports = router;
