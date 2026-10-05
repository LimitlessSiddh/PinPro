import { test, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as firebaseAdmin from '../src/firebaseAdmin';
import { api, pool, registerUser, resetDb, startServer, validRound } from './helpers';

let server: Awaited<ReturnType<typeof startServer>>;
let base: string;

before(async () => {
  server = await startServer();
  base = server.url;
});
after(async () => {
  await server.close();
  await pool.end();
});
beforeEach(async () => {
  await resetDb();
  mock.restoreAll();
});

// --- password auth ---

test('register returns a session and rejects weak or email-like usernames', async () => {
  const ok = await api(base, 'POST', '/api/auth/register', { username: ' alice ', password: 'password123' });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.username, 'alice');
  assert.ok(ok.body.token);

  const dup = await api(base, 'POST', '/api/auth/register', { username: 'alice', password: 'password123' });
  assert.equal(dup.status, 409);

  const short = await api(base, 'POST', '/api/auth/register', { username: 'bob', password: 'short' });
  assert.equal(short.status, 400);

  const email = await api(base, 'POST', '/api/auth/register', { username: 'v@gmail.com', password: 'password123' });
  assert.equal(email.status, 400);
});

test('login succeeds with the right password only', async () => {
  await registerUser(base, 'alice');
  const ok = await api(base, 'POST', '/api/auth/login', { username: 'alice', password: 'password123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await api(base, 'POST', '/api/auth/login', { username: 'alice', password: 'wrong-pass' });
  assert.equal(bad.status, 401);

  const missing = await api(base, 'POST', '/api/auth/login', {});
  assert.equal(missing.status, 400);
});

// --- Google sign-in (Firebase verification stubbed at the token boundary) ---

const stubGoogle = (claims: Record<string, unknown> | null) =>
  mock.method(firebaseAdmin, 'verifyFirebaseToken', async () => claims as never);

test('Google sign-in creates one account and returns a usable session (identity regression)', async () => {
  stubGoogle({ uid: 'g-1', email: 'golfer@example.com', email_verified: true });

  const first = await api(base, 'POST', '/api/auth/sync-firebase-user', undefined, 'firebase-id-token');
  assert.equal(first.status, 201);
  assert.equal(first.body.user.username, 'golfer@example.com');

  // The token it returns must actually unlock the user's data — this was the original bug.
  const clubs = await api(base, 'GET', '/api/clubs', undefined, first.body.token);
  assert.equal(clubs.status, 200);

  const again = await api(base, 'POST', '/api/auth/sync-firebase-user', undefined, 'firebase-id-token');
  assert.equal(again.status, 200);
  assert.equal(again.body.user.id, first.body.user.id);
});

test('Google sign-in rejects invalid tokens and unverified emails', async () => {
  stubGoogle(null);
  assert.equal((await api(base, 'POST', '/api/auth/sync-firebase-user', undefined, 'bad')).status, 401);
  assert.equal((await api(base, 'POST', '/api/auth/sync-firebase-user')).status, 401);

  mock.restoreAll();
  stubGoogle({ uid: 'g-2', email: 'x@example.com', email_verified: false });
  assert.equal((await api(base, 'POST', '/api/auth/sync-firebase-user', undefined, 't')).status, 403);
});

test('Google sign-in never takes over an existing account with the same username', async () => {
  // Simulates a pre-existing password account named with someone's email (allowed before this fix).
  await pool.query(
    "INSERT INTO users (username, password_hash) VALUES ('victim@example.com', 'x')"
  );
  stubGoogle({ uid: 'g-3', email: 'victim@example.com', email_verified: true });
  const res = await api(base, 'POST', '/api/auth/sync-firebase-user', undefined, 't');
  assert.equal(res.status, 409);
  const linked = await pool.query("SELECT firebase_uid FROM users WHERE username = 'victim@example.com'");
  assert.equal(linked.rows[0].firebase_uid, null);
});

// --- authorization ---

test('clubs and rounds require a valid session', async () => {
  for (const [method, path] of [['GET', '/api/clubs'], ['PUT', '/api/clubs'], ['GET', '/api/rounds'], ['POST', '/api/rounds']]) {
    const body = method === 'GET' ? undefined : {};
    assert.equal((await api(base, method, path, body)).status, 401, `${method} ${path} without token`);
    assert.equal((await api(base, method, path, body, 'forged.token.value')).status, 401, `${method} ${path} forged`);
  }
});

test('one user cannot read or overwrite another user’s data', async () => {
  const alice = await registerUser(base, 'alice');
  const bob = await registerUser(base, 'bob');

  await api(base, 'PUT', '/api/clubs', { clubs: { Driver: 250 } }, alice.token);
  await api(base, 'POST', '/api/rounds', validRound(18), alice.token);

  // Old-style client-supplied ids are ignored; the token decides whose data it is.
  await api(base, 'PUT', '/api/clubs', { userId: alice.user.id, clubs: { Driver: 100 } }, bob.token);

  assert.deepEqual((await api(base, 'GET', '/api/clubs', undefined, alice.token)).body.clubs, { Driver: 250 });
  assert.deepEqual((await api(base, 'GET', '/api/clubs', undefined, bob.token)).body.clubs, { Driver: 100 });
  assert.equal((await api(base, 'GET', '/api/rounds', undefined, bob.token)).body.rounds.length, 0);
});

// --- clubs ---

test('clubs save, replace, and come back as numbers', async () => {
  const { token } = await registerUser(base, 'alice');
  const saved = await api(base, 'PUT', '/api/clubs', { clubs: { Driver: 250, '7 Iron': 150 } }, token);
  assert.equal(saved.status, 200);

  await api(base, 'PUT', '/api/clubs', { clubs: { '7 Iron': 155 } }, token);
  const got = await api(base, 'GET', '/api/clubs', undefined, token);
  assert.deepEqual(got.body.clubs, { '7 Iron': 155 });
  assert.equal(typeof got.body.clubs['7 Iron'], 'number');
});

test('invalid club data is rejected and leaves saved clubs untouched', async () => {
  const { token } = await registerUser(base, 'alice');
  await api(base, 'PUT', '/api/clubs', { clubs: { Driver: 250 } }, token);

  for (const clubs of [{ Driver: 0 }, { Driver: -5 }, { Driver: 401 }, { Driver: 150.5 }, { Driver: '250' }, { Spoon: 200 }, null, []]) {
    const res = await api(base, 'PUT', '/api/clubs', { clubs }, token);
    assert.equal(res.status, 400, JSON.stringify(clubs));
  }
  assert.deepEqual((await api(base, 'GET', '/api/clubs', undefined, token)).body.clubs, { Driver: 250 });
});

// --- rounds ---

test('9- and 18-hole rounds save with server-computed score', async () => {
  const { token } = await registerUser(base, 'alice');

  const nine = await api(base, 'POST', '/api/rounds', validRound(9, { shots: 1, finalScore: -50 }), token);
  assert.equal(nine.status, 201);
  assert.equal(nine.body.shots, 27); // client-sent shots/finalScore are ignored
  assert.equal(nine.body.finalScore, -9); // 27 − par 36

  const eighteen = await api(base, 'POST', '/api/rounds', validRound(18), token);
  assert.equal(eighteen.status, 201);
  assert.equal(eighteen.body.finalScore, -18);

  const list = await api(base, 'GET', '/api/rounds', undefined, token);
  assert.equal(list.body.rounds.length, 2);
  assert.equal(list.body.rounds[0].total_holes, 18); // newest first
  assert.equal(typeof list.body.rounds[0].course_rating, 'number');
});

test('invalid rounds are rejected with a specific message', async () => {
  const { token } = await registerUser(base, 'alice');
  const cases: [Record<string, unknown>, RegExp][] = [
    [validRound(9, { courseName: '   ' }), /course name/i],
    [validRound(9, { totalHoles: 12 }), /9 or 18/],
    [validRound(18, { slopeRating: 200 }), /slope/i],
    [validRound(18, { courseRating: 0 }), /course rating/i],
    [validRound(18, { par: 20 }), /par/i],
    [validRound(9, { shotData: [] }), /hole 1 has no shots/i],
    [validRound(9, { shotData: [{ hole: 10, club: 'Driver', distance: 300 }] }), /hole number/i],
  ];
  for (const [body, message] of cases) {
    const res = await api(base, 'POST', '/api/rounds', body, token);
    assert.equal(res.status, 400);
    assert.match(res.body.error, message);
  }
});

test('handicap estimate uses 18-hole rounds only and needs 3 of them', async () => {
  const { token } = await registerUser(base, 'alice');
  for (let i = 0; i < 2; i++) await api(base, 'POST', '/api/rounds', validRound(18), token);
  await api(base, 'POST', '/api/rounds', validRound(9), token);

  let list = await api(base, 'GET', '/api/rounds', undefined, token);
  assert.equal(list.body.handicap.value, null);
  assert.equal(list.body.handicap.roundsConsidered, 2);

  await api(base, 'POST', '/api/rounds', validRound(18), token);
  list = await api(base, 'GET', '/api/rounds', undefined, token);
  // 54 strokes, rating 72, slope 113 → differential −18; lowest 1 − 2 = −20
  assert.equal(list.body.handicap.value, -20);
});

test('malformed JSON gets a 400, unknown routes a 404', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.equal(res.status, 400);
  assert.equal((await api(base, 'GET', '/api/nope')).status, 404);
});
