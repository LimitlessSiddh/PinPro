"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = void 0;
const jwt_1 = require("../lib/jwt");
// Every clubs/rounds request is scoped to the user in the signed token, never a client-sent id.
const verifyAuth = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token ? (0, jwt_1.verifySession)(token) : null;
    if (!userId) {
        res.status(401).json({ error: 'Your session has expired. Please log in again.' });
        return;
    }
    req.userId = userId;
    next();
};
exports.verifyAuth = verifyAuth;
