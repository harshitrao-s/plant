# Mini Project Manager

A small project and task manager. You sign up with an email and password, create
projects, and manage the tasks inside each project. Everything you create is tied
to your account — no other user can read or change it.

Written entirely in JavaScript (no TypeScript).

## Stack

| Layer     | Choice                                       |
| --------- | -------------------------------------------- |
| Frontend  | React 19 + Next.js 16 (App Router)           |
| State     | Redux Toolkit + react-redux                  |
| Backend   | Node.js + Express 5 (separate process)       |
| Database  | MongoDB via Mongoose (Atlas or local)        |
| Auth      | JWT (`Authorization: Bearer <token>`)        |
| Validation| Zod on every request body                    |
| Styling   | Tailwind CSS v4 + plain CSS in `globals.css` |

## Requirements

- Node.js 22 or newer (the dev script uses `node --watch` and `--env-file-if-exists`)
- npm
- MongoDB — optional for a quick look, see the note below

## Setup

```bash
git clone <your-repo-url>
cd mini-project-manager
npm install
cp .env.example .env     # on Windows: copy .env.example .env
```

Open `.env` and set at least `JWT_SECRET`. For `MONGODB_URI` you have two options:

- **Real MongoDB** — paste a local URI or a MongoDB Atlas connection string.
- **Nothing at all** — leave `MONGODB_URI` empty. In development the API boots an
  in-memory MongoDB automatically so you can try the app with zero setup. That
  data is wiped when the API process stops. In production an empty `MONGODB_URI`
  is a startup error, on purpose.

## Running

```bash
npm run dev
```

That starts both processes together:

- Express API — <http://localhost:4000>
- Next.js app — <http://localhost:3000>

Open <http://localhost:3000>. You can also run them separately with
`npm run dev:api` and `npm run dev:web`.

For a production build:

```bash
npm run build
npm start
```

### Sample `.env`

```env
MONGODB_URI=mongodb://127.0.0.1:27017/mini-project-manager
JWT_SECRET=replace-with-a-long-random-string
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
API_URL=http://localhost:4000
```

## Project layout

```
server/              Express API (its own Node process)
  index.js           All routes, Zod schemas, sorting, error handler
  auth.js            signToken() and the requireAuth middleware
  db.js              Mongo connection, with the in-memory fallback
  models.js          Mongoose schemas + the shapes sent to the client
src/
  app/               Next.js App Router pages
    page.jsx                   Landing page
    login/, signup/            Auth screens
    projects/page.jsx          Project list and project CRUD
    projects/[id]/             Task board for one project
  components/        AppHeader, AuthForm, Providers
  store/             Redux slices: auth, projects, tasks
  lib/api.js         fetch wrapper that attaches the JWT
  proxy.js           Route protection before a page renders
```

## API

All routes are under `/api`. Everything except signup, login and health needs an
`Authorization: Bearer <token>` header.

| Method   | Route                      | Purpose                                     |
| -------- | -------------------------- | ------------------------------------------- |
| `GET`    | `/api/health`              | Server and database status                  |
| `POST`   | `/api/auth/signup`         | Create an account, returns user + token     |
| `POST`   | `/api/auth/login`          | Log in, returns user + token                |
| `GET`    | `/api/auth/me`             | The user the current token belongs to       |
| `GET`    | `/api/projects`            | Your projects, with a task count on each    |
| `POST`   | `/api/projects`            | Create a project                            |
| `GET`    | `/api/projects/:id`        | One project                                 |
| `PATCH`  | `/api/projects/:id`        | Update title and description                |
| `DELETE` | `/api/projects/:id`        | Delete a project and all of its tasks       |
| `GET`    | `/api/projects/:id/tasks`  | Tasks, with `?status=` and `?sort=`         |
| `POST`   | `/api/projects/:id/tasks`  | Create a task in that project               |
| `PATCH`  | `/api/tasks/:id`           | Update a task                               |
| `DELETE` | `/api/tasks/:id`           | Delete a task                               |

Task query parameters:

- `status` — `todo`, `in-progress`, `done`
- `sort` — `dueDate` (default), `title`, `status`, `createdAt`. Always ascending.

### Data shapes

```jsonc
// Project
{ "id": "…", "title": "Website redesign", "description": "…",
  "taskCount": 3, "createdAt": "…", "updatedAt": "…" }

// Task
{ "id": "…", "title": "Write the brief", "description": "…",
  "status": "todo", "dueDate": "2026-12-01", "projectId": "…",
  "createdAt": "…", "updatedAt": "…" }
```

## Implementation notes

- **Two processes, one origin.** The brief asked for an Express API, so the API
  is a real standalone server rather than Next.js route handlers. `next.config.js`
  rewrites `/api/*` to `http://localhost:4000`, so the browser only ever talks to
  one origin and there is no CORS problem in development. Change `API_URL` to point
  the frontend at a deployed API.
- **Ownership is enforced in the query.** Every project and task query carries
  `user: req.userId`. A request for someone else's id returns 404, never their data.
- **Route protection runs twice.** `src/proxy.js` (the Next.js 16 replacement for
  `middleware.js`) redirects before a protected page renders, based on a
  non-secret `pm_session` flag cookie. The real check is the JWT on the API, and
  each page also redirects to `/login` once the store knows the token is invalid.
- **The JWT lives in `localStorage`**, which keeps the API stateless and simple.
  An `httpOnly` cookie would resist XSS better and is what I would use if this
  app handled real data.
- **Sorting happens in Node, not MongoDB**, so that tasks without a due date sit
  at the bottom instead of jumping to the top the way MongoDB orders `null`.
- **Validation is shared in spirit, not in code.** Zod rejects bad input on the
  server; the forms use native HTML validation for the same rules so the user
  sees the problem before a request goes out.
- **Cache Components is on** (a Next.js 16 feature). The Redux store is created
  with randomness, which cannot be frozen into a static shell, so `Providers` is
  rendered behind `<Suspense>` in `src/app/layout.jsx`.

## Troubleshooting

**Login or signup returns 500.** The Next.js app is running but the Express API
is not. `next.config.js` forwards `/api/*` to `API_URL`, and when nothing is
listening there the rewrite fails with a 500. Check it directly:

```bash
curl http://localhost:4000/api/health
```

No answer means the API is down — start it with `npm run dev:api`, or run
`npm run dev` so both processes come up together.

**"Another next dev server is already running."** An older `next dev` for this
project is still alive on another port. Either use the port it prints, or stop
it (`taskkill /PID <pid> /F` on Windows) and run `npm run dev` again. Note that
`next dev` will also pick a different port if 3000 is taken by another app.

## Checks

```bash
npm run lint      # ESLint, clean
npm run build     # production build, passes
```

## Deployment

The database, the API and the frontend are deployed as three separate things.

### 1. Database — MongoDB Atlas

1. Create a free M0 cluster at <https://www.mongodb.com/atlas>.
2. **Database Access** → add a user, and save the password.
3. **Network Access** → allow `0.0.0.0/0`, so the API host can reach it.
4. **Connect → Drivers** → copy the connection string and put your password and
   a database name into it:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mini-project-manager?retryWrites=true&w=majority
```

### 2. API — Render (or Railway / Fly)

Create a **Web Service** from the repository:

| Setting       | Value                 |
| ------------- | --------------------- |
| Build command | `npm install`         |
| Start command | `npm run start:api`   |

Environment variables:

| Key                         | Value                                     |
| --------------------------- | ----------------------------------------- |
| `MONGODB_URI`               | the Atlas string from step 1              |
| `JWT_SECRET`                | a long random string                      |
| `NODE_ENV`                  | `production`                              |
| `CLIENT_ORIGIN`             | the frontend URL from step 3              |
| `MONGOMS_DISABLE_POSTINSTALL` | `1`                                     |

`PORT` is set by the host, so do not add it yourself.

The last variable stops `mongodb-memory-server` from downloading a MongoDB
binary during the build. It is a devDependency and is never used in production,
but `npm install` would still run its postinstall script.

Check it worked by opening `https://your-api.onrender.com/api/health`.

> On Render's free tier the service sleeps after inactivity, so the first
> request after a pause can take up to a minute.

### 3. Frontend — Vercel

Import the repository. The defaults are correct; add one environment variable:

| Key       | Value                               |
| --------- | ----------------------------------- |
| `API_URL` | `https://your-api.onrender.com`     |

`next.config.js` reads `API_URL` and rewrites `/api/*` to it, so the browser
only ever talks to the Vercel domain and no CORS setup is needed.

### 4. Finish the loop

Go back to the API host and set `CLIENT_ORIGIN` to the Vercel URL, then
redeploy. Open the site, sign up, and create a project to confirm the three
pieces are talking to each other.
