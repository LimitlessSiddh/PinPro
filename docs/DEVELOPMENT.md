# Development Guide

How to run and test PinPro locally, from a fresh clone.

## Layout

```
pinpro/
  backend/    Express + TypeScript API, Postgres (pg), Firebase Admin
    db/schema.sql   schema the code expects (used for test databases)
    test/           node:test API + handicap tests
  frontend/   React 19 + Vite + Tailwind 4 SPA, Firebase Auth (client, lazy-loaded), Google Maps
    e2e/            Playwright journeys
docs/         this guide, DESIGN.md, before/after screenshots
dataconnect/, firebase.json, .firebaserc   Firebase CLI scaffolding (unused by the app)
```

## Prerequisites

- **Node 18** for the backend (pinned in `pinpro/backend/.node-version` and `engines`; Render uses it). Tests and builds also run on newer Node.
- npm (lockfiles are committed: use `npm ci`).
- PostgreSQL (local, for development and tests).
- Optional: a Firebase project (Google sign-in) and a Google Maps key (course autocomplete). The app runs without both; the Google button and autocomplete simply don't appear.

## How auth works

There is **one session model**: the backend issues its own JWT (7 days) on register, login, or Google sign-in.

- Google: the client gets a Firebase ID token, `POST /api/auth/sync-firebase-user` verifies it (and requires a verified email), and the backend returns its JWT. The Firebase session is signed out right away.
- The frontend stores `{ token, user }` under the `pinpro.session` localStorage key (`src/lib/session.ts`). All calls go through `apiFetch` (`src/lib/api.ts`), which sends `Authorization: Bearer <token>` and returns the user to login on a 401.
- Clubs and rounds routes use `verifyAuth`. The user is **always** taken from the token, never from the URL or body.

## API

| Endpoint | Auth | Notes |
|---|---|---|
| `POST /api/auth/register` | – | username 3–30 chars `[A-Za-z0-9_.-]` (no `@`), password ≥ 8 → `{ token, user }` |
| `POST /api/auth/login` | – | → `{ token, user }` |
| `POST /api/auth/sync-firebase-user` | Firebase ID token | 409 if the email is already a password account's username (no silent linking) |
| `GET /api/clubs` | JWT | `{ clubs: { "7 Iron": 150, … } }`, numbers |
| `PUT /api/clubs` | JWT | replaces the whole set in one transaction; known club names, whole yards 1–400 |
| `GET /api/rounds` | JWT | `{ rounds, handicap: { value, roundsUsed, roundsConsidered, minimumRounds } }` |
| `POST /api/rounds` | JWT | `{ courseName, totalHoles, par, courseRating, slopeRating, shotData }`; strokes and score are computed server-side |
| `GET /api/health` | – | `{ ok: true }` |

**Handicap** (`backend/src/lib/handicap.ts`) is an *estimate* modelled on WHS Rule 5.2: the last 20 18-hole rounds, the lowest N differentials from the WHS table (with adjustments for 3, 4 and 6 rounds), at least 3 rounds required, rounded to 0.1, capped at 54. It uses gross score because there are no per-hole pars, so there's no net-double-bogey cap and no PCC. 9-hole rounds are excluded. It's computed on read; `users.handicap` is no longer written.

## 1. Backend

```bash
cd pinpro/backend
npm ci
cp .env.example .env      # fill in values
npm run dev               # ts-node src/index.ts → http://localhost:5050
```

| Script | Does |
|---|---|
| `npm run dev` | Runs `src/index.ts` with ts-node |
| `npm run build` | `tsc` → `dist/` (**commit it**, see Deploy) |
| `npm start` | `node dist/index.js` (what production runs) |
| `npm run test:db` | Creates the local `pinpro_test` database from `db/schema.sql` |
| `npm test` | API + handicap tests against `pinpro_test` (refuses any other DB) |

### Env vars (`pinpro/backend/.env`)

| Var | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string. **Point local dev at a local DB**, not production. |
| `NODE_ENV` | `production` turns on SSL and makes `JWT_SECRET` mandatory |
| `PORT` | Default `5050` |
| `JWT_SECRET` | Required in production (the server refuses to start without it). Dev-only fallback otherwise. |
| `FIREBASE_PROJECT_ID` | **Required for Google sign-in.** Must equal the frontend's `VITE_FIREBASE_PROJECT_ID` (currently `pinpro-c635b`). Verifying ID tokens needs only this; read on first Google login, not at boot. |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Optional service account. Used only if both are set (private key uses literal `\n`). |

CORS allows `https://pin-pro.vercel.app`, plus any `http://localhost:<port>` when `NODE_ENV` isn't `production`.

## 2. Frontend

```bash
cd pinpro/frontend
npm ci
cp .env.example .env.local   # *.local is gitignored
npm run dev                  # http://localhost:5173
```

| Var | Notes |
|---|---|
| `VITE_API_URL` | API base URL. **Defaults to production** (`https://pinpro.onrender.com`); set `http://localhost:5050` for local work |
| `VITE_FIREBASE_*` | Optional. Without `VITE_FIREBASE_API_KEY` the Google button is hidden. For local Google sign-in, add `localhost` to Firebase → Authentication → Authorized domains |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional. Enables course-name autocomplete |

| Script | Does |
|---|---|
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint (clean) |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:e2e` | Playwright: starts the real backend on `:5051` against `pinpro_e2e` and Vite on `:5174`, truncates `pinpro_e2e` first |

One-time E2E setup: `createdb pinpro_e2e && psql -d pinpro_e2e -f ../backend/db/schema.sql && npx playwright install chromium`.

E2E coverage: register and onboarding, clubs persistence and validation, a 9-hole round (suggestions, validation, resume after refresh), an 18-hole round with the handicap rule, logout and deep-link login, expired/forged and legacy sessions, Google sign-in success and failure (popup stubbed via `window.__pinproGoogleToken` in `--mode test` only), no horizontal overflow and labelled inputs at 375/768/1024/1440, skip link and focus. Every test fails on unexpected console errors.

Real Google sign-in can't be automated (it needs a Google account); verify it by hand after any auth change.

## 3. Deploy

| Half | Host | How |
|---|---|---|
| Frontend | Vercel (`pin-pro.vercel.app`) | Builds `pinpro/frontend`. `vercel.json` rewrites every non-file path to `/` |
| Backend | Render (`pinpro.onrender.com`) | Runs `npm start` → `node dist/index.js` on Node 18 |

**`pinpro/backend/dist/` is committed on purpose.** Render's build command isn't recorded in the repo, so after any backend change run `npm run build` and commit `dist/` with the source. If Render does run `npm run build`, add `dist/` to `.gitignore` and untrack it.

The API contract changed in the 2026-10 refresh (token auth, no `userId` in paths). Deploy the backend and frontend together, backend first.
