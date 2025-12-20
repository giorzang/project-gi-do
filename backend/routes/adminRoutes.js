const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// All admin routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Stats
router.get('/stats', adminController.getStats);

// Users Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/ban', adminController.updateUserBan);

// Servers Management
router.get('/servers', adminController.getServers);
router.post('/servers', adminController.createServer);
router.put('/servers/:id', adminController.updateServer);
router.delete('/servers/:id', adminController.deleteServer);
router.post('/servers/:id/test-rcon', adminController.testServerRcon);

// Maps Management
router.get('/maps', adminController.getMaps);
router.post('/maps', adminController.createMap);
router.put('/maps/:map_key', adminController.updateMap);
router.delete('/maps/:map_key', adminController.deleteMap);

module.exports = router;
