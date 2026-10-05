# Development Guide

How to run PinPro locally, from a fresh clone.

## Layout

```
pinpro/
  backend/    Express + TypeScript API, Postgres (pg), Firebase Admin
  frontend/   React 19 + Vite + Tailwind 4 SPA, Firebase Auth (client), Google Maps
dataconnect/, firebase.json, .firebaserc   Firebase CLI scaffolding (unused by the app)
```

## Prerequisites

- **Node 18** (pinned in `pinpro/backend/.node-version` and `engines`; Render uses it). Newer Node builds fine locally but prints an `EBADENGINE` warning.
- npm (lockfiles are committed: use `npm ci`).
- A Postgres database.
- A Firebase project with Email/Google sign-in, a web app config, and a service account.
- A Google Maps JavaScript API key (Places library enabled).

## 1. Backend

```bash
cd pinpro/backend
npm ci
cp .env.example .env      # fill in values
npm run dev               # ts-node src/index.ts → http://localhost:5050
```

| Script | Does |
|---|---|
| `npm run dev` | Runs `src/index.ts` with ts-node (no reload; `nodemon` is installed but unused) |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/index.js` (what production runs) |

### Env vars (`pinpro/backend/.env`)

| Var | Used in | Notes |
|---|---|---|
| `DATABASE_URL` | `src/db.ts` | Postgres connection string |
| `NODE_ENV` | `src/db.ts` | `production` turns on SSL (`rejectUnauthorized: false`) |
| `PORT` | `src/index.ts` | Default `5050` |
| `JWT_SECRET` | `src/controllers/authController.ts` | Falls back to `dev_secret` if unset |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | `src/firebaseAdmin.ts` | Service-account creds. Private key uses literal `\n`. Missing/invalid values crash startup |

### Database

There are no migrations. Tables inferred from the SQL in the controllers:

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,   -- email for Google users
  password_hash TEXT,                   -- null for Google users
  firebase_uid  TEXT,
  handicap      NUMERIC
);
CREATE TABLE clubs (
  user_id  INTEGER REFERENCES users(id),
  name     TEXT,
  distance NUMERIC
);
CREATE TABLE rounds (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  total_holes   INTEGER,
  shots         INTEGER,
  final_score   INTEGER,                -- relative to par
  par           INTEGER,
  shot_data     JSONB,
  course_name   TEXT,
  slope_rating  NUMERIC,
  course_rating NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

Column types are a best guess. Check against the production DB before relying on them.

## 2. Frontend

```bash
cd pinpro/frontend
npm ci
cp .env.example .env.local   # fill in values (*.local is gitignored)
npm run dev                  # http://localhost:5173
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` → `dist/` (gitignored) |
| `npm run lint` | ESLint. Currently reports 6 pre-existing errors (unused catch vars, `any` in StartRound) |
| `npm run preview` | Serve the built bundle |

Env vars: `VITE_FIREBASE_*` (six web-app config values) and `VITE_GOOGLE_MAPS_API_KEY`. See `.env.example`.

> ⚠️ **The frontend always talks to the production API.** `https://pinpro.onrender.com` is hard-coded in `Login`, `Register`, `Setup`, `StartRound`, `Profile`, and `GoogleLoginButton`. Running both halves locally does **not** connect them; the local frontend reads and writes production data. To point it at `localhost:5050` you currently have to edit those URLs (an `API_URL` env var would be the fix).

## 3. Deploy

| Half | Host | How |
|---|---|---|
| Frontend | Vercel (`pin-pro.vercel.app`) | Builds `pinpro/frontend`. `vercel.json` rewrites every non-file path to `/` for client-side routing |
| Backend | Render (`pinpro.onrender.com`) | Runs `npm start` → `node dist/index.js` on Node 18 |

**`pinpro/backend/dist/` is committed on purpose.** Render's build command isn't recorded anywhere in the repo, and Render may be serving the committed build. Until that's confirmed, **after any backend change run `npm run build` and commit `dist/` with the source.** If Render's build command does run `npm run build`, add `dist/` to `pinpro/backend/.gitignore` and untrack it.

CORS allows only `http://localhost:5173` and `https://pin-pro.vercel.app` (`src/index.ts`).
