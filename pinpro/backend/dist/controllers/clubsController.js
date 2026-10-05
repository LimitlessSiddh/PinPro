"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClubs = exports.saveClubs = void 0;
const db_1 = require("../db");
const clubs_1 = require("../lib/clubs");
// Returns an error message, or null when every entry is a known club with a whole-yard distance.
const validateClubs = (clubs) => {
    if (!clubs || typeof clubs !== 'object' || Array.isArray(clubs)) {
        return 'clubs must be an object of club name to yards';
    }
    for (const [name, yards] of Object.entries(clubs)) {
        if (!clubs_1.CLUB_NAMES.includes(name))
            return `Unknown club: ${name}`;
        if (!Number.isInteger(yards) || yards < 1 || yards > clubs_1.MAX_CLUB_YARDS) {
            return `${name} must be a whole number of yards between 1 and ${clubs_1.MAX_CLUB_YARDS}`;
        }
    }
    return null;
};
const saveClubs = async (req, res) => {
    const clubs = req.body?.clubs;
    const error = validateClubs(clubs);
    if (error) {
        res.status(400).json({ error });
        return;
    }
    // Replace the whole set atomically so a failed insert can't leave the user with no clubs.
    const client = await db_1.pool.connect().catch(() => null);
    if (!client) {
        res.status(503).json({ error: 'Database unavailable. Please try again.' });
        return;
    }
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM clubs WHERE user_id = $1', [req.userId]);
        for (const [name, distance] of Object.entries(clubs)) {
            await client.query('INSERT INTO clubs (user_id, name, distance) VALUES ($1, $2, $3)', [req.userId, name, distance]);
        }
        await client.query('COMMIT');
        res.status(200).json({ clubs });
    }
    catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        console.error('Error saving clubs:', err);
        res.status(500).json({ error: 'Failed to save clubs' });
    }
    finally {
        client.release();
    }
};
exports.saveClubs = saveClubs;
const getClubs = async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT name, distance FROM clubs WHERE user_id = $1', [req.userId]);
        // NUMERIC columns come back from pg as strings; the client needs numbers.
        const clubs = {};
        for (const row of result.rows) {
            const yards = Number(row.distance);
            if (yards > 0)
                clubs[row.name] = yards;
        }
        res.status(200).json({ clubs });
    }
    catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ error: 'Failed to fetch clubs' });
    }
};
exports.getClubs = getClubs;
