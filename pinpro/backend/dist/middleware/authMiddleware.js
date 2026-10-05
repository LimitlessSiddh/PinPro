"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = void 0;
const firebaseAdmin_1 = require("../firebaseAdmin");
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
};
exports.verifyAuth = verifyAuth;
