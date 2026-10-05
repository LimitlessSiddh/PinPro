"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const clubs_1 = __importDefault(require("./routes/clubs"));
const rounds_1 = __importDefault(require("./routes/rounds"));
const auth_1 = __importDefault(require("./routes/auth"));
const allowedOrigins = ['https://pin-pro.vercel.app'];
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const localDev = process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin ?? '');
        // Unknown origins get no CORS headers, so the browser blocks the response.
        callback(null, !origin || allowedOrigins.includes(origin) || localDev);
    },
}));
exports.app.use(express_1.default.json({ limit: '100kb' }));
exports.app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});
exports.app.use('/api/clubs', clubs_1.default);
exports.app.use('/api/rounds', rounds_1.default);
exports.app.use('/api/auth', auth_1.default);
exports.app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Malformed JSON and anything a handler throws end up here instead of an HTML stack trace.
exports.app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Request body must be valid JSON' });
        return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Server error' });
});
