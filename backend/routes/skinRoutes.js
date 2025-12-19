const express = require('express');
const router = express.Router();
const skinController = require('../controllers/skinController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get all user preferences (skins, knife, agents, gloves, music, pin)
router.get('/', verifyToken, skinController.getUserPreferences);

// Weapon skins
router.post('/weapon', verifyToken, skinController.setSkin);
router.delete('/weapon', verifyToken, skinController.deleteSkin);

// Knife
router.post('/knife', verifyToken, skinController.setKnife);
router.delete('/knife', verifyToken, skinController.deleteKnife);

// Agents
router.post('/agent', verifyToken, skinController.setAgent);
router.delete('/agent', verifyToken, skinController.deleteAgent);

// Gloves
router.post('/gloves', verifyToken, skinController.setGloves);
router.delete('/gloves', verifyToken, skinController.deleteGloves);

// Music
router.post('/music', verifyToken, skinController.setMusic);
router.delete('/music', verifyToken, skinController.deleteMusic);

// Pins
router.post('/pin', verifyToken, skinController.setPin);
router.delete('/pin', verifyToken, skinController.deletePin);

module.exports = router;
