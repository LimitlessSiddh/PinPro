"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const app_1 = require("./app");
const db_1 = require("./db");
const jwt_1 = require("./lib/jwt");
(0, jwt_1.assertJwtConfigured)();
// schema.sql is all CREATE TABLE IF NOT EXISTS, so this sets up a fresh database and is a no-op otherwise.
// A failure is logged, not fatal: the API still boots and DB-backed routes return 500 until the DB is back.
db_1.pool
    .query((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../db/schema.sql'), 'utf8'))
    .then(() => console.log('Database schema ready'))
    .catch((err) => console.error('Database schema check failed:', err))
    .finally(() => {
    const PORT = process.env.PORT || 5050;
    app_1.app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
