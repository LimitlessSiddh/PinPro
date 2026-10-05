# PinPro

Golf caddy web app: users save club distances, play rounds with club suggestions, and track round history and handicap. Live at https://pin-pro.vercel.app (frontend, Vercel) + https://pinpro.onrender.com (API, Render). The repo is public.

Setup, env vars, DB schema and deploy details are in `docs/DEVELOPMENT.md`.

## Map

```
pinpro/backend/src/
  index.ts              Express app, CORS allowlist, mounts routers, PORT (5050)
  db.ts                 pg Pool from DATABASE_URL
  firebaseAdmin.ts      Firebase Admin init + verifyFirebaseToken()
  routes/*.ts           thin routers → controllers
  controllers/*.ts      all logic + raw SQL (parameterized)
  middleware/authMiddleware.ts   verifyAuth: defined but NOT used by any route
pinpro/backend/dist/    compiled output, COMMITTED (see gotchas)
pinpro/frontend/src/
  App.tsx               routes; auth = token/firebaseToken in localStorage
  firebase.ts           Firebase client (VITE_FIREBASE_*)
  main.tsx              injects Google Maps script, renders App
  pages/                Home, Login, Register, Setup, StartRound, Profile, RoundSummary (unrouted)
  components/           Navbar, GoogleLoginButton, ProtectedRoutes, Loader/LogoutButton (unused)
```

### API → controller → tables

| Endpoint | Controller | Tables | Called from |
|---|---|---|---|
| `POST /api/auth/register` | `register` (bcrypt + JWT) | users | `Register.tsx` |
| `POST /api/auth/login` | `login` | users | `Login.tsx` |
| `POST /api/auth/sync-firebase-user` | `syncFirebaseUser` (Bearer Firebase ID token) | users | `GoogleLoginButton.tsx` |
| `GET /api/clubs/:userId` | `getClubs` | clubs | `Setup.tsx`, `StartRound.tsx` |
| `POST /api/clubs/save` | `saveClubs` (delete + reinsert) | clubs | `Setup.tsx` |
| `POST /api/rounds/save` | `saveRound` (also recomputes handicap from last 5 rounds) | rounds, users | `StartRound.tsx` |
| `GET /api/rounds/:userId` | `getRounds` | rounds, users | `Profile.tsx` |

Frontend routes: `/` Home, `/login`, `/register`, protected `/profile`, `/start`, `/setup`.

## Commands

```bash
cd pinpro/backend  && npm ci && npm run dev     # :5050, needs .env
cd pinpro/backend  && npm run build             # tsc → dist/ (commit it!)
cd pinpro/frontend && npm ci && npm run dev     # :5173, needs .env.local
cd pinpro/frontend && npm run build && npm run lint
```

There are no tests and no CI. "It works" means: both builds pass, and you've clicked through the flow.

## Conventions

- Backend: CommonJS TS, `strict`. Controllers are `async (req, res): Promise<void>` that send the response and return. SQL always uses `$1` params.
- Frontend: React 19 function components, Tailwind utility classes, PascalCase files in `pages/` and `components/`.
- Node 18 (Render). Don't upgrade deps casually: the backend runs in production.

## Gotchas

- **`pinpro/backend/dist/` is committed and may be what Render serves.** After any backend `src` change, run `npm run build` and commit `dist/` too. Don't gitignore it until Siddh confirms Render's build command runs `npm run build`.
- **Frontend hard-codes `https://pinpro.onrender.com`** in 6 files. Local frontend dev hits the **production** API and data.
- **No authz on clubs/rounds:** they trust the `userId` sent by the client. `verifyAuth` exists but isn't wired up.
- Two parallel auth paths: username/password (backend JWT in `token`) and Google (Firebase ID token in `firebaseToken`). The backend never verifies the JWT on later requests.
- `JWT_SECRET` falls back to `'dev_secret'`.
- `StartRound.tsx` injects a Maps script from `pinpro.onrender.com/maps/...`, which is a bug. `main.tsx` already loads the real one.
- `dataconnect/`, `firebase.json`, `.firebaserc` are Firebase CLI template leftovers. The app uses plain Postgres.
- Credentials from `.env` were committed in history (untracked as of 2026-10-04). Treat them as exposed until rotated.
- Frontend lint has 6 pre-existing errors. Don't count them as yours.
