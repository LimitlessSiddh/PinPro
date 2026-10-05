import { execSync } from 'node:child_process';

export default function globalSetup() {
  const db = process.env.E2E_DATABASE_URL ?? 'postgres://localhost/pinpro_e2e';
  if (!db.includes('pinpro_e2e')) throw new Error('Refusing to reset a database that is not pinpro_e2e');
  execSync(`psql "${db}" -q -c "TRUNCATE rounds, clubs, users RESTART IDENTITY CASCADE"`);
}
