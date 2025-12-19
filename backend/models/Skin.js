const pool = require('../config/database');

class Skin {
    /**
     * Get all skins for a user
     * @param {string} steamId - User's Steam ID
     */
    static async getUserSkins(steamId) {
        const sql = `
            SELECT weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_team
            FROM wp_player_skins
            WHERE steamid = ?
        `;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows;
    }

    /**
     * Get user's knives (can have different knife for CT and T)
     * @param {string} steamId - User's Steam ID
     */
    static async getUserKnives(steamId) {
        const sql = `SELECT * FROM wp_player_knife WHERE steamid = ?`;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows;
    }

    /**
     * Get user's agents
     * @param {string} steamId - User's Steam ID
     */
    static async getUserAgents(steamId) {
        const sql = `SELECT * FROM wp_player_agents WHERE steamid = ?`;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows;
    }

    /**
     * Get user's gloves
     * @param {string} steamId - User's Steam ID
     */
    static async getUserGloves(steamId) {
        const sql = `SELECT * FROM wp_player_gloves WHERE steamid = ?`;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows;
    }

    /**
     * Get user's music kit
     * @param {string} steamId - User's Steam ID
     */
    static async getUserMusic(steamId) {
        const sql = `SELECT * FROM wp_player_music WHERE steamid = ?`;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows;
    }

    /**
     * Get user's pin
     * @param {string} steamId - User's Steam ID
     */
    static async getUserPin(steamId) {
        const sql = `SELECT * FROM wp_player_pins WHERE steamid = ? LIMIT 1`;
        const [rows] = await pool.execute(sql, [steamId]);
        return rows[0] || null;
    }

    /**
     * Set weapon skin (INSERT or UPDATE)
     * Using same pattern as original PHP: insert for both teams (2 and 3)
     */
    static async setSkin(steamId, { weaponDefindex, paintId, wear = 0, seed = 0, team = 'BOTH' }) {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        for (const t of teams) {
            const sql = `
                INSERT INTO wp_player_skins (steamid, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_team)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    weapon_paint_id = VALUES(weapon_paint_id),
                    weapon_wear = VALUES(weapon_wear),
                    weapon_seed = VALUES(weapon_seed)
            `;
            await pool.execute(sql, [steamId, weaponDefindex, paintId, wear, seed, t]);
        }
        return true;
    }

    /**
     * Delete weapon skin
     */
    static async deleteSkin(steamId, weaponDefindex, team = 'BOTH') {
        let sql;
        let params;

        if (team === 'BOTH') {
            sql = `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ?`;
            params = [steamId, weaponDefindex];
        } else {
            const t = team === 'T' ? 2 : 3;
            sql = `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?`;
            params = [steamId, weaponDefindex, t];
        }

        await pool.execute(sql, params);
        return true;
    }

    /**
     * Set knife type
     * Delete existing knife for the team first, then insert new one
     */
    static async setKnife(steamId, knifeName, team = 'BOTH') {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        // Delete existing knife for the selected team(s) first
        for (const t of teams) {
            await pool.execute(
                `DELETE FROM wp_player_knife WHERE steamid = ? AND weapon_team = ?`,
                [steamId, t]
            );
        }

        // Insert new knife for the selected team(s)
        for (const t of teams) {
            const sql = `
                INSERT INTO wp_player_knife (steamid, knife, weapon_team)
                VALUES (?, ?, ?)
            `;
            await pool.execute(sql, [steamId, knifeName, t]);
        }
        return true;
    }

    /**
     * Delete knife (reset to default)
     */
    static async deleteKnife(steamId, team = 'BOTH') {
        if (team === 'BOTH') {
            await pool.execute(`DELETE FROM wp_player_knife WHERE steamid = ?`, [steamId]);
        } else {
            const t = team === 'T' ? 2 : 3;
            await pool.execute(`DELETE FROM wp_player_knife WHERE steamid = ? AND weapon_team = ?`, [steamId, t]);
        }
        return true;
    }

    /**
     * Set agent
     */
    static async setAgent(steamId, agentModel, team) {
        if (team === 'CT') {
            const sql = `
                INSERT INTO wp_player_agents (steamid, agent_ct)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE agent_ct = VALUES(agent_ct)
            `;
            await pool.execute(sql, [steamId, agentModel]);
        } else {
            const sql = `
                INSERT INTO wp_player_agents (steamid, agent_t)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE agent_t = VALUES(agent_t)
            `;
            await pool.execute(sql, [steamId, agentModel]);
        }
        return true;
    }

    /**
     * Delete agent
     */
    static async deleteAgent(steamId, team) {
        if (team === 'CT') {
            const sql = `UPDATE wp_player_agents SET agent_ct = NULL WHERE steamid = ?`;
            await pool.execute(sql, [steamId]);
        } else {
            const sql = `UPDATE wp_player_agents SET agent_t = NULL WHERE steamid = ?`;
            await pool.execute(sql, [steamId]);
        }
        return true;
    }

    /**
     * Set gloves
     * Delete existing gloves for the team first, then insert new one
     */
    static async setGloves(steamId, { weaponDefindex, paintId, team = 'BOTH' }) {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        // Delete existing gloves for the selected team(s) first
        for (const t of teams) {
            await pool.execute(
                `DELETE FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?`,
                [steamId, t]
            );
        }

        // Insert new gloves for the selected team(s)
        for (const t of teams) {
            const sql = `
                INSERT INTO wp_player_gloves (steamid, weapon_defindex, weapon_team)
                VALUES (?, ?, ?)
            `;
            await pool.execute(sql, [steamId, weaponDefindex, t]);
        }
        return true;
    }

    /**
     * Delete gloves
     */
    static async deleteGloves(steamId, team = 'BOTH') {
        if (team === 'BOTH') {
            await pool.execute(`DELETE FROM wp_player_gloves WHERE steamid = ?`, [steamId]);
        } else {
            const t = team === 'T' ? 2 : 3;
            await pool.execute(`DELETE FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?`, [steamId, t]);
        }
        return true;
    }

    /**
     * Set music kit
     */
    static async setMusic(steamId, musicId, team = 'BOTH') {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        for (const t of teams) {
            const sql = `
                INSERT INTO wp_player_music (steamid, music_id, weapon_team)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE music_id = VALUES(music_id)
            `;
            await pool.execute(sql, [steamId, musicId, t]);
        }
        return true;
    }

    /**
     * Delete music kit
     */
    static async deleteMusic(steamId, team = 'BOTH') {
        if (team === 'BOTH') {
            await pool.execute(`DELETE FROM wp_player_music WHERE steamid = ?`, [steamId]);
        } else {
            const t = team === 'T' ? 2 : 3;
            await pool.execute(`DELETE FROM wp_player_music WHERE steamid = ? AND weapon_team = ?`, [steamId, t]);
        }
        return true;
    }

    /**
     * Set pin
     */
    static async setPin(steamId, pinId) {
        const teams = [2, 3];

        for (const t of teams) {
            const sql = `
                INSERT INTO wp_player_pins (steamid, id, weapon_team)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE id = VALUES(id)
            `;
            await pool.execute(sql, [steamId, pinId, t]);
        }
        return true;
    }

    /**
     * Delete pin
     */
    static async deletePin(steamId) {
        await pool.execute(`DELETE FROM wp_player_pins WHERE steamid = ?`, [steamId]);
        return true;
    }
}

module.exports = Skin;
