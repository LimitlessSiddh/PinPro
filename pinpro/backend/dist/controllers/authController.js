"use strict";
// src/controllers/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncFirebaseUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const firebaseAdmin_1 = require("../firebaseAdmin");
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    try {
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const result = await db_1.pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username', [username, hashed]);
        const user = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });
        res.status(201).json({ token, userId: user.id, username: user.username });
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'Username already exists' });
        }
        else {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};
exports.register = register;
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db_1.pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = result.rows[0];
        const match = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({ token, userId: user.id, username: user.username });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
const syncFirebaseUser = async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Missing Firebase token' });
        return;
    }
    const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
    if (!decoded) {
        res.status(403).json({ error: 'Invalid Firebase token' });
        return;
    }
    const uid = decoded.uid;
    const email = decoded.email;
    if (!uid || !email) {
        res.status(400).json({ error: 'Missing Firebase user data in token' });
        return;
    }
    try {
        const existing = await db_1.pool.query('SELECT id, username FROM users WHERE firebase_uid = $1', [uid]);
        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            res.status(200).json({ userId: user.id, username: user.username });
            return;
        }
        const insertResult = await db_1.pool.query(`INSERT INTO users (username, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username`, [email, uid]);
        if (insertResult.rows.length > 0) {
            const user = insertResult.rows[0];
            res.status(201).json({ userId: user.id, username: user.username });
            return;
        }
        const fallback = await db_1.pool.query('SELECT id, username FROM users WHERE username = $1', [email]);
        if (fallback.rows.length > 0) {
            const user = fallback.rows[0];
            await db_1.pool.query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [uid, user.id]);
            res.status(200).json({ userId: user.id, username: user.username });
            return;
        }
        throw new Error('Could not sync or resolve Firebase user.');
    }
    catch (error) {
        console.error('❌ Error syncing Firebase user:', error);
        res.status(500).json({ error: 'Failed to sync Firebase user' });
    }
};
exports.syncFirebaseUser = syncFirebaseUser;
