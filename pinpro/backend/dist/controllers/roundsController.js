"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRounds = exports.saveRound = void 0;
const db_1 = require("../db");
const saveRound = async (req, res) => {
    const { userId, totalHoles, shots, finalScore, par, shotData, courseName, slopeRating, courseRating, } = req.body;
    if (!userId ||
        !totalHoles ||
        !shots ||
        finalScore === undefined ||
        !par ||
        !courseName ||
        !slopeRating ||
        !courseRating) {
        res.status(400).json({ error: 'Missing required round data' });
        return;
    }
    try {
        await db_1.pool.query(`INSERT INTO rounds 
      (user_id, total_holes, shots, final_score, par, shot_data, course_name, slope_rating, course_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            userId,
            totalHoles,
            shots,
            finalScore,
            par,
            JSON.stringify(shotData),
            courseName,
            slopeRating,
            courseRating,
        ]);
        const roundRes = await db_1.pool.query(`SELECT final_score, par, course_rating, slope_rating
       FROM rounds
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`, [userId]);
        const recentRounds = roundRes.rows;
        const standardSlope = 113;
        const differentials = recentRounds.map((r) => {
            const actualScore = r.final_score + r.par;
            const differential = ((actualScore - r.course_rating) * standardSlope) / r.slope_rating;
            return differential;
        });
        const handicap = Math.round(differentials.reduce((a, b) => a + b, 0) / differentials.length);
        await db_1.pool.query('UPDATE users SET handicap = $1 WHERE id = $2', [handicap, userId]);
        res.status(200).json({ message: 'Round saved and handicap updated' });
    }
    catch (error) {
        console.error('❌ Error saving round:', error);
        res.status(500).json({ error: 'Failed to save round' });
    }
};
exports.saveRound = saveRound;
const getRounds = async (req, res) => {
    const { userId } = req.params;
    console.log('✅ GET /api/rounds/:userId hit with userId:', userId);
    if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
    }
    try {
        const roundsResult = await db_1.pool.query(`SELECT id, total_holes, shots, final_score, par, created_at, course_name
       FROM rounds
       WHERE user_id = $1
       ORDER BY created_at DESC`, [userId]);
        const userResult = await db_1.pool.query('SELECT handicap FROM users WHERE id = $1', [userId]);
        const handicap = userResult.rows.length > 0 ? userResult.rows[0].handicap : 0;
        res.status(200).json({
            rounds: roundsResult.rows,
            handicap,
        });
    }
    catch (error) {
        console.error('❌ Error fetching rounds:', error);
        res.status(500).json({ error: 'Failed to fetch round history' });
    }
};
exports.getRounds = getRounds;
