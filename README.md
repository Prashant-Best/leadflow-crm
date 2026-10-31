# LeadFlow CRM

A small CRM for web development and digital marketing agencies. It keeps every prospective client (lead) in one place, moves leads through a sales pipeline, schedules follow-ups against them and shows a dashboard calculated from the saved records.

Built with **MongoDB, Express.js, React and Node.js (MERN)**.

**Author:** Prashant Panwar

---

## Feature status

| ID | Module | Status |
|---|---|---|
| M01 | Authentication: register, login, logout, protected API routes | Done |
| M02 | Lead management: create, list, view, edit, delete, search by name/company, filter by stage | Done |
| M03 | Pipeline: change a lead's stage from a dropdown, persisted in MongoDB | Done |
| M04 | Follow-ups: create for a lead, list (with status filter), mark complete | Done |
| M05 | Dashboard: total, active, won leads, pending and overdue follow-ups from the database | Done |
| M06 | Security/validation: server-side validation, bcrypt hashing, JWT, ownership checks | Done |
| M07 | Persistence: users, leads and activities stored in MongoDB | Done |
| M08 | Handover: README, `.env.example`, test checklist | Done |

Extras that were cheap to add on top of the required scope: a pipeline-by-stage breakdown and "next follow-ups" list on the dashboard, an "Overdue" filter on the follow-ups page, filters kept in the URL, and a demo data seed script.

## Primary workflow

Register / log in → add a lead → view or edit it → change its stage → schedule a follow-up → mark the follow-up complete → refresh the page (everything is still there).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, Axios, plain responsive CSS |
| Backend | Node.js (20.19+), Express 5 REST API |
| Database | MongoDB with Mongoose 8 (local MongoDB or MongoDB Atlas) |
| Auth | JWT (HS256) for API requests, bcryptjs for password hashing |
| Validation | express-validator on every request + Mongoose schema validation |
| Security | helmet, CORS allow-list, express-rate-limit on auth routes |
| Testing | Jest, Supertest, mongodb-memory-server |
| Deployment | Vercel (static React build + Express as a serverless function) |

## Architecture

```
React (Vite)  --HTTP/JSON-->  /api/v1  Express routes
                                         -> middleware (auth, validation, ownership)
                                         -> controllers
                                         -> Mongoose models
                                         -> MongoDB
```

```
leadflow-crm/
├── api/index.js              # Vercel serverless entry (re-exports the Express app)
├── vercel.json               # build + rewrite rules for Vercel
├── package.json              # npm workspaces: server + client
├── server/
│   ├── .env.example
│   ├── scripts/seed.js       # demo data
│   ├── src/
│   │   ├── app.js            # Express app (no listen) - used by server.js, tests and Vercel
│   │   ├── server.js         # local entry: checks env, connects DB, starts listening
│   │   ├── config/           # env loading, MongoDB connection
│   │   ├── constants/        # enum lists (stages, sources, types...)
│   │   ├── models/           # User, Lead, Activity
│   │   ├── middleware/       # auth, validate, loadOwned, ensureDb, rateLimiter, errorHandler
│   │   ├── validators/       # express-validator rules per resource
│   │   ├── controllers/      # request handlers
│   │   ├── routes/           # URL -> middleware -> controller
│   │   └── utils/            # ApiError, response helper, JWT helpers, regex escaping
│   └── tests/                # Jest + Supertest API tests
└── client/
    ├── .env.example
    └── src/
        ├── api/              # Axios instance + one module per resource
        ├── context/          # AuthContext (login state)
        ├── components/       # layout, route guards, forms, lists, shared UI
        ├── pages/            # one component per screen
        ├── hooks/            # useDebounce, useFlashMessage
        ├── utils/            # error parsing, date/currency formatting
        └── constants/        # enum lists (mirror of the server's)
```

## Prerequisites

- Node.js **20.19 or newer** (tested on Node 24) and npm
- MongoDB, one of:
  - Docker: `docker run -d --name leadflow-mongo -p 27017:27017 -v leadflow-mongo-data:/data/db mongo:7`
  - a local MongoDB Community Server install, or
  - a free MongoDB Atlas cluster (copy its connection string)

## Local setup

```bash
git clone https://github.com/Prashant-Best/leadflow-crm.git
cd leadflow-crm
npm install
```

Create the server environment file and edit the values:

```bash
cp server/.env.example server/.env        # PowerShell: Copy-Item server/.env.example server/.env
```

Optionally load demo data (creates `demo@leadflow.test` with sample leads; see `server/scripts/seed.js` for the password):

```bash
npm run seed
```

Start the API and the web app in two terminals:

```bash
npm run dev:server     # http://localhost:5000/api/v1
npm run dev:client     # http://localhost:5173
```

Open http://localhost:5173 and register an account. In development Vite proxies `/api` to the Express server, so the browser only talks to one origin.

## Environment variables

`server/.env`

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `MONGODB_URI` | yes | `mongodb://127.0.0.1:27017/leadflow` | MongoDB connection string |
| `JWT_SECRET` | yes | long random string | Signs and verifies JWTs |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime |
| `PORT` | no | `5000` | Local API port |
| `NODE_ENV` | no | `development` | `production` on the host |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Comma-separated origins allowed by CORS |
| `BCRYPT_ROUNDS` | no | `10` | bcrypt cost factor |

`client/.env` (optional)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API base URL. Leave empty when the API is on the same origin. Never put secrets in `VITE_*` variables - they are bundled into the browser code. |

Real `.env` files are git-ignored; only the `.env.example` files are committed.

## Scripts (run from the repository root)

| Command | What it does |
|---|---|
| `npm run dev:server` | API with auto-restart (`node --watch`) |
| `npm run dev:client` | Vite dev server |
| `npm test` | Runs the Jest API test suite against an in-memory MongoDB |
| `npm run seed` | Resets and loads the demo account's sample data |
| `npm run build` | Production build of the React app into `client/dist` |
| `npm start` | Starts the API without auto-restart |

The first `npm test` run downloads a MongoDB binary (~100 MB) for the in-memory database. To use an existing local database instead, set `MONGODB_URI_TEST`.

## API summary

Base path: `/api/v1`. All bodies are JSON. Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | API and database status (no secrets) |
| POST | `/auth/register` | – | Create an account, returns `{ user, token }` |
| POST | `/auth/login` | – | Log in, returns `{ user, token }` |
| GET | `/auth/me` | ✔ | Current user's profile |
| GET | `/leads?search=&stage=&active=` | ✔ | List my leads (search name/company, filter by stage, `active=true` = not Won/Lost) |
| POST | `/leads` | ✔ | Create a lead |
| GET | `/leads/:id` | ✔ | Get one lead |
| PATCH | `/leads/:id` | ✔ | Update allowed lead fields |
| DELETE | `/leads/:id` | ✔ | Delete a lead and its follow-ups |
| GET | `/activities?status=&overdue=&leadId=` | ✔ | List my follow-ups (soonest first) |
| POST | `/activities` | ✔ | Create a follow-up for one of my leads |
| PATCH | `/activities/:id` | ✔ | Edit a follow-up or mark it complete (`{ "status": "Completed" }`) |
| GET | `/dashboard/summary` | ✔ | Counts calculated from the database |

**Response format**

```json
{ "success": true, "message": "Lead created", "data": { "lead": { "id": "...", "name": "..." } } }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```

**Status codes:** `200` OK, `201` created, `400` invalid input / malformed id / unknown field, `401` missing, invalid or expired token, `403` record belongs to another user, `404` record or route not found, `409` email already registered, `413` body too large, `429` too many auth attempts, `503` database unreachable or server not configured, `500` unexpected error (generic message, no stack trace).

### Option lists

| Field | Allowed values |
|---|---|
| Lead `stage` | New (default), Contacted, Qualified, Proposal Sent, Won, Lost |
| Lead `source` | Website, Referral, Social Media, Email, Direct Outreach, Other (default) |
| Lead `serviceInterest` | Website Development, SEO, Social Media Marketing, Paid Ads, Branding, Other (default) |
| Follow-up `type` | Call, Email, Meeting, Task (default) |
| Follow-up `status` | Pending (default), Completed |

## Business rules

- A lead needs a **name** and **at least one of email or phone**. Email must be valid when given; a phone number needs 7-15 digits (spaces, dashes, brackets and a leading + allowed); budget must be **0 or more**.
- `createdBy` is always set from the logged-in user's token. Requests that try to set `_id`, `createdBy`, `createdAt`, `updatedAt`, `completedAt` or any unknown field are rejected with `400`.
- **Active leads** = leads not in `Won` or `Lost`.
- **Pending follow-ups** = status `Pending` (this includes overdue ones).
- **Overdue follow-ups** = status `Pending` and `dueAt` earlier than the current server time. Completed follow-ups are never overdue.
- `completedAt` is set by the server the first time a follow-up is marked complete. Completing it again keeps the original time. Reopening a completed follow-up is not supported (returns `400`).
- Deleting a lead first deletes all of its follow-ups, then the lead.
- Dashboard numbers are counted from MongoDB on every request - nothing is hardcoded.

### Ownership and access checks

Each user only sees and changes the records they created. Every `/leads/:id` and `/activities/:id` request loads the record and compares its `createdBy` with the logged-in user: unknown id → `404`, someone else's record → `403`, malformed id → `400`. Creating a follow-up also checks that the lead exists and belongs to the user. The brief describes a single-workspace demo, so per-user ownership is a deliberate interpretation of "record access checks"; switching to a shared workspace would mean removing the `createdBy` filter.

### Timezones

All dates are stored in MongoDB as UTC. The API only accepts valid ISO 8601 date-times (impossible dates such as 30 February are rejected) **with** a timezone (e.g. `2026-11-05T10:30:00.000Z` or `2026-11-05T16:00:00+05:30`), so a time is never ambiguous. The browser converts the user's local `datetime-local` input to UTC before sending and shows dates back in the user's local timezone. "Overdue" is decided by the server clock.

## Security measures

- Passwords hashed with bcryptjs; the hash is excluded from queries (`select: false`) and from every JSON response.
- JWT signature and expiry verified on every protected route; the algorithm is pinned to HS256.
- All bodies, query parameters and ObjectIds validated server-side; unknown fields rejected (`checkExact`).
- Login returns the same message for unknown email and wrong password.
- Search text is regex-escaped before it reaches MongoDB; non-string values (e.g. `{ "$gt": "" }`) are rejected.
- helmet security headers, CORS restricted to `CLIENT_ORIGIN`, 100 kb JSON body limit, rate limit on `/auth/*`.
- Errors never include stack traces or configuration; request logs contain method, path, status and time only (no query strings, bodies, tokens or passwords).
- `.env` files are git-ignored.

## Testing

```bash
npm test
```

47 automated API tests (Jest + Supertest + in-memory MongoDB) cover registration, login, token checks, every protected route without a token, lead CRUD, validation errors, search/filter, cross-user access, cascade delete, follow-up rules, missing-configuration handling and exact dashboard counts. The manual browser checklist with recorded results is in [TEST_CHECKLIST.md](TEST_CHECKLIST.md).

## Deployment (Vercel)

The repository deploys as one Vercel project:

- `npm run build` produces the React app in `client/dist`, served as static files.
- `api/index.js` exports the Express app as a serverless function; `vercel.json` rewrites `/api/*` to it, and every other path to `index.html` so React Router deep links work.
- The MongoDB connection is opened on the first request and reused while the function instance stays warm.

Environment variables to set in the Vercel project: `MONGODB_URI` (Atlas connection string), `JWT_SECRET`, `JWT_EXPIRES_IN` (optional), `NODE_ENV=production`. With MongoDB Atlas, allow access from anywhere (`0.0.0.0/0`) in Network Access, because Vercel functions do not have fixed IP addresses.

## Known limitations

- The JWT is stored in `localStorage` (simple, but readable by any script running on the page if an XSS bug existed). Logout is client-side; tokens are not revoked on the server and stay valid until they expire.
- Deleting a lead and its follow-ups is two separate operations, not a MongoDB transaction (transactions need a replica set).
- The enum lists are duplicated in the client and server.
- No pagination or sorting options on the lists - fine for an evaluation-sized dataset.
- Search uses a case-insensitive regex, which cannot use an index on large collections.
- The auth rate limiter keeps counts in memory, so on serverless hosting each instance counts separately.
- Completed follow-ups cannot be reopened.
- Budget is assumed to be in Indian Rupees (₹).
