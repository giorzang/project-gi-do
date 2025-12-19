const Skin = require('../models/Skin');

/**
 * Get all skin preferences for authenticated user
 */
const getUserPreferences = async (req, res) => {
    try {
        const steamId = req.user.uid;

        const [skins, knives, agents, gloves, music, pin] = await Promise.all([
            Skin.getUserSkins(steamId),
            Skin.getUserKnives(steamId),
            Skin.getUserAgents(steamId).catch(() => []),
            Skin.getUserGloves(steamId).catch(() => []),
            Skin.getUserMusic(steamId).catch(() => []),
            Skin.getUserPin(steamId).catch(() => null)
        ]);

        res.json({
            success: true,
            data: { skins, knives, agents, gloves, music, pin }
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set weapon skin
 */
const setSkin = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { weaponDefindex, paintId, wear, seed, team } = req.body;

        if (!weaponDefindex || paintId === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        await Skin.setSkin(steamId, { weaponDefindex, paintId, wear, seed, team });
        res.json({ success: true, message: 'Skin applied successfully' });
    } catch (error) {
        console.error('Error setting skin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete weapon skin
 */
const deleteSkin = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { weaponDefindex, team } = req.body;

        if (!weaponDefindex) {
            return res.status(400).json({ success: false, message: 'Missing weapon_defindex' });
        }

        await Skin.deleteSkin(steamId, weaponDefindex, team);
        res.json({ success: true, message: 'Skin removed successfully' });
    } catch (error) {
        console.error('Error deleting skin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set knife type
 */
const setKnife = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { knifeName, team } = req.body;

        if (!knifeName) {
            return res.status(400).json({ success: false, message: 'Missing knife name' });
        }

        await Skin.setKnife(steamId, knifeName, team || 'BOTH');
        res.json({ success: true, message: 'Knife applied successfully' });
    } catch (error) {
        console.error('Error setting knife:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete knife
 */
const deleteKnife = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { team } = req.body || {};
        await Skin.deleteKnife(steamId, team || 'BOTH');
        res.json({ success: true, message: 'Knife reset successfully' });
    } catch (error) {
        console.error('Error deleting knife:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set agent
 */
const setAgent = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { agentModel, team } = req.body;

        if (!agentModel || !team) {
            return res.status(400).json({ success: false, message: 'Missing agent model or team' });
        }

        await Skin.setAgent(steamId, agentModel, team);
        res.json({ success: true, message: 'Agent applied successfully' });
    } catch (error) {
        console.error('Error setting agent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete agent
 */
const deleteAgent = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { team } = req.body;

        if (!team) {
            return res.status(400).json({ success: false, message: 'Missing team' });
        }

        await Skin.deleteAgent(steamId, team);
        res.json({ success: true, message: 'Agent reset successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set gloves
 */
const setGloves = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { weaponDefindex, paintId, team } = req.body;

        if (!weaponDefindex || paintId === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        await Skin.setGloves(steamId, { weaponDefindex, paintId, team });
        res.json({ success: true, message: 'Gloves applied successfully' });
    } catch (error) {
        console.error('Error setting gloves:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete gloves
 */
const deleteGloves = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { team } = req.body;
        await Skin.deleteGloves(steamId, team);
        res.json({ success: true, message: 'Gloves reset successfully' });
    } catch (error) {
        console.error('Error deleting gloves:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set music kit
 */
const setMusic = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { musicId, team } = req.body;

        if (!musicId) {
            return res.status(400).json({ success: false, message: 'Missing music ID' });
        }

        await Skin.setMusic(steamId, musicId, team);
        res.json({ success: true, message: 'Music kit applied successfully' });
    } catch (error) {
        console.error('Error setting music:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete music kit
 */
const deleteMusic = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { team } = req.body;
        await Skin.deleteMusic(steamId, team);
        res.json({ success: true, message: 'Music kit reset successfully' });
    } catch (error) {
        console.error('Error deleting music:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Set pin
 */
const setPin = async (req, res) => {
    try {
        const steamId = req.user.uid;
        const { pinId } = req.body;

        if (!pinId) {
            return res.status(400).json({ success: false, message: 'Missing pin ID' });
        }

        await Skin.setPin(steamId, pinId);
        res.json({ success: true, message: 'Pin applied successfully' });
    } catch (error) {
        console.error('Error setting pin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Delete pin
 */
const deletePin = async (req, res) => {
    try {
        const steamId = req.user.uid;
        await Skin.deletePin(steamId);
        res.json({ success: true, message: 'Pin reset successfully' });
    } catch (error) {
        console.error('Error deleting pin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getUserPreferences,
    setSkin,
    deleteSkin,
    setKnife,
    deleteKnife,
    setAgent,
    deleteAgent,
    setGloves,
    deleteGloves,
    setMusic,
    deleteMusic,
    setPin,
    deletePin
};
