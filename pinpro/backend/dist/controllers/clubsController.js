"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClubs = exports.saveClubs = void 0;
const db_1 = require("../db");
const saveClubs = async (req, res) => {
    const { userId, clubs } = req.body;
    if (!userId || typeof clubs !== 'object') {
        res.status(400).json({ error: 'userId and clubs are required' });
        return;
    }
    try {
        await db_1.pool.query('DELETE FROM clubs WHERE user_id = $1', [userId]);
        const insertPromises = Object.entries(clubs).map(([name, distance]) => db_1.pool.query('INSERT INTO clubs (user_id, name, distance) VALUES ($1, $2, $3)', [userId, name, distance]));
        await Promise.all(insertPromises);
        res.status(200).json({ message: 'Club data saved successfully' });
    }
    catch (error) {
        console.error('Error saving clubs:', error);
        res.status(500).json({ error: 'Failed to save clubs' });
    }
};
exports.saveClubs = saveClubs;
const getClubs = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
    }
    try {
        const result = await db_1.pool.query('SELECT name, distance FROM clubs WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No club data found for this user' });
            return;
        }
        const clubs = {};
        result.rows.forEach((row) => {
            clubs[row.name] = row.distance;
        });
        res.status(200).json(clubs);
    }
    catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ error: 'Failed to fetch clubs' });
    }
};
exports.getClubs = getClubs;
