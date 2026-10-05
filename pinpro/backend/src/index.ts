import 'dotenv/config';
import { readFileSync } from 'fs';
import path from 'path';
import { app } from './app';
import { pool } from './db';
import { assertJwtConfigured } from './lib/jwt';

assertJwtConfigured();

// schema.sql is all CREATE TABLE IF NOT EXISTS, so this sets up a fresh database and is a no-op otherwise.
// A failure is logged, not fatal: the API still boots and DB-backed routes return 500 until the DB is back.
pool
  .query(readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'))
  .then(() => console.log('Database schema ready'))
  .catch((err) => console.error('Database schema check failed:', err))
  .finally(() => {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
