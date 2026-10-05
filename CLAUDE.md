# PinPro

Golf caddy web app: users save club distances, play rounds with club suggestions, and track round history and handicap. Live at https://pin-pro.vercel.app (frontend, Vercel) + https://pinpro.onrender.com (API, Render). The repo is public.

Setup, env vars, DB schema and deploy details are in `docs/DEVELOPMENT.md`.

## Map

```
pinpro/backend/src/
  index.ts              loads env, asserts JWT config, listens (PORT 5050)
  app.ts                Express app: CORS, routers, 404 + JSON error handler (tests import this)
  db.ts                 pg Pool from DATABASE_URL
  firebaseAdmin.ts      lazy Firebase Admin init + verifyFirebaseToken()
  lib/jwt.ts            signSession / verifySession (backend JWT, 7d)
  lib/handicap.ts       WHS-style handicap *estimate* (pure)
  lib/clubs.ts          allowed club names (frontend lib/golf.ts mirrors it)
  middleware/authMiddleware.ts   verifyAuth → req.userId from the JWT
  routes/*.ts, controllers/*.ts  raw parameterized SQL
pinpro/backend/db/schema.sql     schema for local/test DBs (no migrations exist)
pinpro/backend/test/             node:test against pinpro_test
pinpro/backend/dist/             compiled output, COMMITTED (see gotchas)
pinpro/frontend/src/
  App.tsx               routes split by useSession(); AppShell wraps signed-in pages
  lib/                  session, api (apiFetch), golf (suggestClub), round (draft + validation), rounds, useApi
  components/           AppShell (nav), ui.tsx (Button/Input/Card/Alert…), RoundPlay, ScoreChart, icons
  pages/                Home, Login, Register, Setup, StartRound, Profile
pinpro/frontend/e2e/    Playwright journeys (real backend on pinpro_e2e)
```

### API → controller → tables (all clubs/rounds routes require the backend JWT)

| Endpoint | Controller | Tables | Called from |
|---|---|---|---|
| `POST /api/auth/register` | `register` | users | `Register.tsx` |
| `POST /api/auth/login` | `login` | users | `Login.tsx` |
| `POST /api/auth/sync-firebase-user` | `syncFirebaseUser` (Bearer Firebase ID token) | users | `GoogleLoginButton.tsx` |
| `GET /api/clubs` / `PUT /api/clubs` | `getClubs` / `saveClubs` (transaction) | clubs | `Setup`, `StartRound`, `Home` |
| `GET /api/rounds` / `POST /api/rounds` | `getRounds` (+handicap) / `saveRound` | rounds | `Profile`, `Home`, `RoundPlay` |

Frontend routes: `/` Home, `/login`, `/register`, `/start`, `/setup`, `/profile`. Design rules: `docs/DESIGN.md`.

## Commands

```bash
cd pinpro/backend  && npm ci && npm run dev     # :5050, needs .env (point DATABASE_URL at a LOCAL db)
cd pinpro/backend  && npm run build             # tsc → dist/ (commit it!)
cd pinpro/backend  && npm run test:db && npm test
cd pinpro/frontend && npm ci && npm run dev     # :5173; set VITE_API_URL=http://localhost:5050
cd pinpro/frontend && npm run build && npm run lint && npm test && npm run test:e2e
```

"It works" means: both builds, lint, unit, backend and e2e tests pass, and you've clicked through the flow.

## Conventions

- Backend: CommonJS TS, `strict`. Controllers are `async (req, res): Promise<void>` that send the response and return. SQL always uses `$1` params.
- Frontend: React 19 function components, Tailwind utility classes, PascalCase files in `pages/` and `components/`.
- Node 18 (Render). Don't upgrade deps casually: the backend runs in production.

## Gotchas

- **`pinpro/backend/dist/` is committed and may be what Render serves.** After any backend `src` change, run `npm run build` and commit `dist/` too. Don't gitignore it until Siddh confirms Render's build command runs `npm run build`.
- **`VITE_API_URL` defaults to production.** Without it, a local frontend reads and writes production data.
- Backend `.env` may hold the production `DATABASE_URL`. Tests refuse to run unless the URL contains `pinpro_test` / `pinpro_e2e`. Never run them against anything else.
- `JWT_SECRET` is mandatory when `NODE_ENV=production` (the server won't boot without it).
- Never trust a client-sent `userId`; use `req.userId` from `verifyAuth`.
- Google accounts use the email as username, so password usernames can't contain `@`. Sync refuses (409) to link onto an existing username.
- pg returns NUMERIC columns as strings. Controllers coerce with `Number()` before responding.
- `dataconnect/`, `firebase.json`, `.firebaserc` are Firebase CLI template leftovers. The app uses plain Postgres.
- Credentials from `.env` were committed in history (untracked as of 2026-10-04). Treat them as exposed until rotated.
- Colors: navy `#202334` + one golf green only (Siddh's call). See `docs/DESIGN.md`.
