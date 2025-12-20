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
     * Delete existing knife and its skins for the team first, then insert new one
     * @param {string} steamId
     * @param {string} knifeName - Knife name like "weapon_knife_butterfly"
     * @param {number} knifeDefindex - New knife defindex (not used for deletion, kept for future use)
     * @param {number} oldKnifeDefindex - Old knife defindex (from frontend) to delete old skins
     * @param {string} team - 'BOTH', 'T', or 'CT'
     */
    static async setKnife(steamId, knifeName, knifeDefindex, oldKnifeDefindex, team = 'BOTH') {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        // 1. Delete old knife skins from wp_player_skins using oldKnifeDefindex from frontend
        if (oldKnifeDefindex) {
            for (const t of teams) {
                await pool.execute(
                    `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?`,
                    [steamId, oldKnifeDefindex, t]
                );
            }
        }

        // 2. Delete existing knife entries for the selected team(s)
        for (const t of teams) {
            await pool.execute(
                `DELETE FROM wp_player_knife WHERE steamid = ? AND weapon_team = ?`,
                [steamId, t]
            );
        }

        // 3. Insert new knife for the selected team(s)
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
     * Delete existing gloves and their skins for the team first, then insert new one
     */
    static async setGloves(steamId, { weaponDefindex, paintId, team = 'BOTH' }) {
        const teams = team === 'BOTH' ? [2, 3] : (team === 'T' ? [2] : [3]);

        // 1. Get current gloves to find their defindexes for skin cleanup
        const currentGloves = await this.getUserGloves(steamId);

        // 2. Delete gloves skins from wp_player_skins for the changing team(s)
        for (const t of teams) {
            const glovesForTeam = currentGloves.find(g => g.weapon_team === t);
            if (glovesForTeam && glovesForTeam.weapon_defindex) {
                // Delete all skins associated with the old gloves defindex
                await pool.execute(
                    `DELETE FROM wp_player_skins WHERE steamid = ? AND weapon_defindex = ? AND weapon_team = ?`,
                    [steamId, glovesForTeam.weapon_defindex, t]
                );
            }
        }

        // 3. Delete existing gloves entries for the selected team(s)
        for (const t of teams) {
            await pool.execute(
                `DELETE FROM wp_player_gloves WHERE steamid = ? AND weapon_team = ?`,
                [steamId, t]
            );
        }

        // 4. Insert new gloves for the selected team(s)
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
