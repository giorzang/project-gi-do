const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentDetail);

// Tournament Posts
router.get('/:id/posts', tournamentController.getTournamentPosts);
router.post('/:id/posts', verifyToken, isAdmin, tournamentController.createTournamentPost);
router.put('/:id/posts/:postId', verifyToken, isAdmin, tournamentController.updateTournamentPost);
router.delete('/:id/posts/:postId', verifyToken, isAdmin, tournamentController.deleteTournamentPost);

// Tournament Teams
router.get('/:id/teams', tournamentController.getTournamentTeams);
router.post('/:id/teams', verifyToken, tournamentController.createTeam);
router.post('/:id/teams/:teamId/join', verifyToken, tournamentController.requestJoinTeam);
router.post('/:id/teams/:teamId/approve/:requestId', verifyToken, tournamentController.approveJoinRequest);
router.delete('/:id/teams/:teamId/reject/:requestId', verifyToken, tournamentController.rejectJoinRequest);

// Tournament Participants (deprecated, use teams instead)
router.get('/:id/participants', tournamentController.getTournamentParticipants);

// Admin Only
router.post('/create', verifyToken, isAdmin, tournamentController.createTournament);
router.post('/:id/start', verifyToken, isAdmin, tournamentController.startTournament);

module.exports = router;
