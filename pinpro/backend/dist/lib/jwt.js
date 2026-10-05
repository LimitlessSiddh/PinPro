"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertJwtConfigured = exports.verifySession = exports.signSession = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SESSION_TTL = '7d'; // long enough that a session can't expire mid-round
function secret() {
    const value = process.env.JWT_SECRET;
    if (value)
        return value;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev_secret_not_for_production';
}
const signSession = (userId) => jsonwebtoken_1.default.sign({ userId }, secret(), { expiresIn: SESSION_TTL });
exports.signSession = signSession;
const verifySession = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret());
        const userId = typeof payload === 'object' ? Number(payload.userId) : NaN;
        return Number.isInteger(userId) && userId > 0 ? userId : null;
    }
    catch {
        return null;
    }
};
exports.verifySession = verifySession;
// Fail at boot rather than on the first login.
const assertJwtConfigured = () => {
    secret();
};
exports.assertJwtConfigured = assertJwtConfigured;
