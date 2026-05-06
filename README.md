# Stack — Team Task Manager

A full-stack team task manager where users create projects, assign tasks to teammates, and track progress with role-based access (Admin / Member).

**Stack:** React · Vite · Node.js · Express · MongoDB · JWT

---

## Features

- **Authentication** — JWT signup / login with bcrypt-hashed passwords
- **Projects & teams** — Create projects, invite members by email, manage roles
- **Role-based access** — Admins can edit projects, manage members, and create labels; members can create and update their own tasks
- **Tasks** — Create, assign, set priority, due date, and labels; track via Kanban-style board (To do / In progress / Completed)
- **Dashboard** — Personal overview of upcoming, overdue, and completed tasks across every project
- **Labels** — Per-project color-coded labels for quick categorization
- **Validation & error handling** — Server-side validation with `express-validator`, structured error responses
- **Responsive UI** — Clean, light-themed interface inspired by Linear / Notion

---

## Tech stack

| Layer       | Technology                                                       |
| ----------- | ---------------------------------------------------------------- |
| Frontend    | React 18, React Router v7, Vite, Axios, Context API, react-hot-toast |
| Backend     | Node.js, Express, Mongoose, JSON Web Tokens, bcryptjs, express-validator |
| Database    | MongoDB (Atlas in production, in-memory for local dev)           |
| Deployment  | Railway (single service serving API + built client)              |

---

## Getting started locally

### 1. Prerequisites

- Node.js 18+ and npm
- Optional: MongoDB Atlas connection string (works without one — falls back to an in-memory DB for development)

### 2. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs root dev tooling, the server, and the client.

### 3. Configure environment variables

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

For local dev you can leave `MONGO_URI` blank — the server will spin up an in-memory MongoDB. Set a strong `JWT_SECRET`.

### 4. Run the dev servers

```bash
npm run dev
```

This runs both the API (port 5000) and the Vite dev server (port 5173) concurrently. Open `http://localhost:5173`.

On first run, the server seeds two demo users and a sample project (see [Demo accounts](#demo-accounts)).

---

## Demo accounts

When the database is empty, the server auto-seeds these accounts:

| Role   | Email             | Password   |
| ------ | ----------------- | ---------- |
| Admin  | `admin@demo.com`  | `demo1234` |
| Member | `member@demo.com` | `demo1234` |

Both have access to a pre-populated project named **"Marketing Launch Q1"** with sample tasks and labels.

To disable seeding, set `SEED_DEMO=false` in your environment.

---

## Deploying to Railway

This project is set up as a **single Railway service** that builds the React client and serves it from the Express server.

### 1. Create a MongoDB Atlas cluster

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0** cluster.
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, click **Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`). Required for Railway.
4. Click **Connect → Drivers**, copy the connection string. Replace `<password>` with your DB user's password and append a database name (e.g. `/team-task-manager`).

### 2. Deploy on Railway

1. Sign in to [railway.app](https://railway.app) and click **New Project → Deploy from GitHub repo**.
2. Select this repository.
3. Railway auto-detects Node.js. The included `nixpacks.toml` and root `package.json` handle the build — no extra config needed.
4. In the **Variables** tab, add:
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — any long random string
   - `JWT_EXPIRE` — `7d`
   - `NODE_ENV` — `production`
   - `SEED_DEMO` — `true` (or `false` if you don't want demo data)
5. Under **Settings → Networking**, click **Generate Domain**.
6. Wait for the deploy to finish, then open the generated URL.

### Build / start commands

Railway runs these automatically via `nixpacks.toml`:

- Install: `npm install && npm --prefix server install && npm --prefix client install`
- Build:   `npm --prefix client run build`
- Start:   `node server/server.js`

In production the Express server serves the built React client at `/` and the API at `/api/*`.

---

## API reference

All endpoints (except auth) require a `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| POST   | `/api/auth/register`    | Create an account        |
| POST   | `/api/auth/login`       | Sign in, receive a token |
| GET    | `/api/auth/me`          | Get the current user     |

### Projects

| Method | Endpoint                                         | Access  | Description                     |
| ------ | ------------------------------------------------ | ------- | ------------------------------- |
| GET    | `/api/projects`                                  | Member  | List my projects                |
| POST   | `/api/projects`                                  | Auth    | Create a project                |
| GET    | `/api/projects/:id`                              | Member  | Project detail                  |
| PUT    | `/api/projects/:id`                              | Admin   | Update project                  |
| DELETE | `/api/projects/:id`                              | Owner   | Delete project (cascade)        |
| POST   | `/api/projects/:id/members`                      | Admin   | Add member by email             |
| PATCH  | `/api/projects/:id/members/:userId`              | Admin   | Change role (admin / member)    |
| DELETE | `/api/projects/:id/members/:userId`              | Admin   | Remove member                   |

### Tasks

| Method | Endpoint                                    | Access            | Description                        |
| ------ | ------------------------------------------- | ----------------- | ---------------------------------- |
| GET    | `/api/projects/:projectId/tasks`            | Project member    | List tasks (filters: status, priority, assignedTo, search) |
| POST   | `/api/projects/:projectId/tasks`            | Project member    | Create a task                      |
| GET    | `/api/tasks/me`                             | Auth              | All tasks assigned to me           |
| GET    | `/api/tasks/:id`                            | Project member    | Task detail                        |
| PUT    | `/api/tasks/:id`                            | Admin / creator / assignee | Update task               |
| DELETE | `/api/tasks/:id`                            | Admin / creator   | Delete task                        |

### Labels

| Method | Endpoint                                       | Access | Description     |
| ------ | ---------------------------------------------- | ------ | --------------- |
| GET    | `/api/projects/:projectId/labels`              | Member | List labels     |
| POST   | `/api/projects/:projectId/labels`              | Admin  | Create label    |
| PUT    | `/api/projects/:projectId/labels/:labelId`     | Admin  | Update label    |
| DELETE | `/api/projects/:projectId/labels/:labelId`     | Admin  | Delete label    |

### Dashboard

| Method | Endpoint         | Description                                 |
| ------ | ---------------- | ------------------------------------------- |
| GET    | `/api/dashboard` | Personal stats, upcoming tasks, recent projects |

---

## Project structure

```
.
├── client/                  React + Vite frontend
│   ├── src/
│   │   ├── components/      Layout, modals, shared UI
│   │   ├── context/         AuthContext, ProjectsContext
│   │   ├── lib/             Formatting helpers
│   │   ├── pages/           Login, Register, Dashboard, Projects, ProjectDetail, MyTasks, Profile
│   │   ├── services/        Axios client
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                  Express API
│   ├── config/db.js         Mongo connection (Atlas in prod, in-memory in dev)
│   ├── controllers/         auth, project, task, category, dashboard
│   ├── middleware/          JWT auth, project RBAC, error handler
│   ├── models/              User, Project, Task, Category
│   ├── routes/              auth, projects, tasks, dashboard
│   ├── seed.js              Demo data seeder
│   └── server.js            Entry point
├── nixpacks.toml            Railway build config
├── package.json             Monorepo scripts
└── README.md
```

---

## Role-based access summary

| Action                      | Admin | Member | Notes                                          |
| --------------------------- | ----- | ------ | ---------------------------------------------- |
| Create a project            | Yes   | Yes    | Creator becomes admin automatically            |
| Edit project name / desc    | Yes   | No     |                                                |
| Delete project              | Owner | No     | Only the original creator can delete           |
| Invite / remove members     | Yes   | No     |                                                |
| Change member roles         | Yes   | No     | Owner must remain admin                        |
| Create / delete labels      | Yes   | No     |                                                |
| Create tasks                | Yes   | Yes    |                                                |
| Edit any task               | Yes   | No     |                                                |
| Edit own / assigned task    | Yes   | Yes    | Members can edit tasks they created or own     |
| Delete a task               | Yes   | Creator only |                                          |

---

## License

MIT
