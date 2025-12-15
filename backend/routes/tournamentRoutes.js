const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentDetail);

// Admin Only
router.post('/create', verifyToken, isAdmin, tournamentController.createTournament);
router.post('/:id/start', verifyToken, isAdmin, tournamentController.startTournament);

module.exports = router;
