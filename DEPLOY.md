# Deploying Care Quality Intelligence (CQI)

CQI is a Vite/React static client plus a small Express API that uses
**better-sqlite3** (a native module) with a SQLite database file.

Two supported topologies:

| Option | Client | API | Data persistence | Effort |
|---|---|---|---|---|
| **A. All-in-one on Vercel** | Vercel static | Vercel serverless function | Demo only — SQLite lives in `/tmp`, reset on cold start | One import |
| **B. Vercel + Render** | Vercel static | Render web service | Persists while the service is up (add a disk for durable) | Two services |

Both keep the same repo. The client calls the API at `/api/*`; set
`VITE_API_BASE` only when the API is on a different origin (Option B).

---

## Option A — all-in-one on Vercel (fastest, matches the import page)

The repo already contains `vercel.json`, an `api/index.ts` serverless entry, and
DB code that writes to `/tmp` when `VERCEL` is set.

1. Push this repo to GitHub (already done).
2. Go to **vercel.com/new** and **Import** the `Care-Quality-Intelligence` repo.
3. Framework preset: **Other** (the `vercel.json` drives the build — leave the
   build/output settings untouched).
4. **Deploy.** Vercel installs the workspaces, builds the client to
   `client/dist`, and bundles the API function.
5. Open the deployment URL and sign in with a demo account (see the README).

**Demo behaviour:** each serverless cold start re-seeds a fresh database in
`/tmp`, so logins work and every page/PDF/export is live, but writes (imports,
config edits, new accounts) reset when the function goes cold. That is expected
for a portfolio demo. For anything durable, use Option B.

**If the Vercel build fails on `better-sqlite3`** (native modules can be fiddly
in serverless bundles), don't fight it — switch to Option B, which runs the API
as a normal Node process where the native module just works.

---

## Option B — static client on Vercel, API on Render (durable)

### API on Render
1. Go to **render.com → New → Blueprint**, point it at this repo. It reads
   `render.yaml` and creates the `cqi-api` web service (build: install +
   `npm run build --workspace server`; start: `npm run start --workspace server`).
2. Deploy. Note the service URL, e.g. `https://cqi-api.onrender.com`.
   Health check: `GET /api/health`.
3. (Optional, durable data) In `render.yaml`, uncomment the `disk` and
   `DATA_DIR=/var/data` env block and redeploy so the SQLite file survives
   restarts.

### Client on Vercel
1. **vercel.com/new** → Import the repo.
2. Framework preset **Vite**, **Root Directory** `client`.
3. Add an environment variable **`VITE_API_BASE`** = your Render URL
   (e.g. `https://cqi-api.onrender.com`).
4. Deploy. The static client now calls the Render API cross-origin (CORS is
   already open on the API).

> For Option B you can ignore/remove `vercel.json` and `api/` since the client
> is built directly from the `client` root.

---

## Local development

```bash
npm install
npm run dev        # API on :4001, client on :5173 (proxies /api → :4001)
```

The database self-seeds on first run; `npm run seed` re-seeds deterministically.
