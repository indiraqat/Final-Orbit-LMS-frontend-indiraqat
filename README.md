# Orbit LMS — Frontend

The web app for **Orbit LMS**, an onboarding learning-management system.
Interns work through courses (modules → materials → quizzes) and track their
progress; mentors (admins) manage courses, modules, materials, and quiz
questions.

It's a static site — plain **HTML, CSS, and vanilla JavaScript**, with no
framework, bundler, or build step. All data comes from the Orbit LMS
backend API (a separate repo — see its README for the API reference).

## Pages

| Page | Who | What it does |
|---|---|---|
| `index.html` | Public | Landing page |
| `about.html` | Public | About page |
| `login.html` / `register.html` | Public | Log in / create an account |
| `privacy-policy.html` / `terms-of-service.html` | Public | Legal pages |
| `user-dashboard.html` | Intern | Progress stats, current track, and enrolled courses |
| `courses.html` | Intern | Enrolled courses with filters and search |
| `course-detail.html?id=<courseId>` | Intern | A course's modules and materials (mark complete) and quizzes |
| `quizzes.html` | Intern | Every quiz across enrolled courses, with status, filters, and search |
| `quiz-take.html?quizId=<quizId>` | Intern | Take a quiz (graded by the server) and view results (`&mode=result`) |
| `profile.html` / `settings.html` | Both | Profile and account settings |
| `admin-dashboard.html` | Mentor | Intern roster and progress overview |
| `manage-courses.html` | Mentor | Create, edit, and delete courses |
| `manage-course-modules.html?courseId=<courseId>` | Mentor | Create, edit, and delete a course's modules |
| `module-editor.html?moduleId=<moduleId>` | Mentor | Edit a module's details, materials, and quiz questions |

After logging in, mentors land on `admin-dashboard.html` and everyone else on
`user-dashboard.html`. The "I am a…" selector on the register page is
decorative — every new account is created as an intern (only an existing admin
can promote someone).

## Project structure

```
Orbit LMS/
├── index.html, about.html, login.html, register.html, ...   # one HTML file per page
├── css/
│   ├── globals.css        # fonts, design tokens (CSS variables), reset, utilities, grid, badges
│   ├── components.css     # buttons, form inputs, cards, progress bars, alerts, avatars, toasts
│   ├── layout.css         # navbar + footer for public pages
│   ├── home.css           # landing page sections
│   ├── auth.css           # login + register
│   ├── dashboard.css      # sidebar/topbar shell used by all logged-in pages
│   ├── admin.css          # modals + module/material/quiz-question editor lists
│   ├── profile.css        # profile + settings
│   └── quiz.css           # quiz-taking view
├── js/
│   ├── api.js             # API_BASE_URL, session helpers, apiFetch()
│   ├── auth-guard.js      # redirects to login if there's no session
│   ├── auth.js            # login + register forms
│   ├── utils.js           # navbar, toasts, form validation helpers
│   ├── dashboard.js       # shared shell: sidebar, real user info, logout
│   ├── user-dashboard.js, courses.js, course-detail.js, quizzes.js, quiz.js
│   ├── profile.js
│   └── admin.js, admin-dashboard.js, admin-courses.js,
│       admin-course-modules.js, module-content.js
└── .vscode/settings.json  # Live Server port (5501)
```

The backend lives in its own repo (`orbit-lms-backend`). It sits inside this
folder on a dev machine, but `.gitignore` excludes it here — keep it that way,
since its local `.env` holds secrets.

## Run it locally

You need a running backend (local or deployed) and any static file server.

1. **Start the backend** — follow the backend README. Seed it if you want
   demo accounts (the credentials are listed there).
2. **Point the frontend at it.** Open `js/api.js` and set `API_BASE_URL`:
```js
   const API_BASE_URL = 'http://localhost:4000/api';
```
3. **Allow the frontend's origin in the backend.** In the backend's `.env`, set
   `CLIENT_ORIGIN` to the exact address you'll open the site at. This
   project's Live Server is configured for port **5501**
   (`.vscode/settings.json`), so:
```
   CLIENT_ORIGIN="http://127.0.0.1:5501"
```
   Restart the backend after changing it.
4. **Serve the site.** In VS Code, right-click `index.html` → **Open with Live
   Server** (or run any static server from this folder, e.g.
   `python3 -m http.server 5501`).

Open the site using the same host as `CLIENT_ORIGIN` — `localhost` and
`127.0.0.1` count as different origins, and a mismatch shows up as a CORS
error in the browser console.

## How auth works

- Logging in stores the JWT and the user object in `localStorage`
  (`orbit_token` and `orbit_user`).
- `apiFetch()` in `js/api.js` adds the `Authorization: Bearer <token>` header
  automatically and throws an `Error` carrying the server's message on any
  non-2xx response.
- `js/auth-guard.js` (included on every logged-in page) sends visitors without
  a session to `login.html` and exposes the user as `window.currentUser`.
- Logging out clears both keys.

## Deploy to Vercel

The frontend is a static site, so Vercel serves it as-is. Recommended setup:

| Piece | Where |
|---|---|
| Frontend (this repo) | Vercel |
| Backend API | Railway (or Render) — see the backend README |
| Database | PostgreSQL (Railway's, or an external one such as Neon) |

The backend is a long-running Express + Prisma server and is configured for
Railway/Render (`railway.json`, `render.yaml`), so deploy it there and put only
the frontend on Vercel.

1. **Deploy the backend first** and note its URL, e.g.
   `https://<service>.up.railway.app`.
2. **Set `API_BASE_URL`** in `js/api.js` to that URL plus `/api`, then commit:
```js
   const API_BASE_URL = 'https://<service>.up.railway.app/api';
```
   There's no build step, so Vercel environment variables can't be injected
   into this file — the URL is edited in the code.
3. **Push this repo to GitHub.** The repo root is the folder containing
   `index.html`.
4. **Import it in Vercel:** [vercel.com](https://vercel.com) → **Add New… →
   Project** → pick the GitHub repo (authorize the Vercel GitHub app if it
   asks).
5. **Project settings:**
   - **Framework Preset:** Other
   - **Build Command:** leave empty
   - **Output Directory:** leave empty — Vercel serves the project root
   - **Root Directory:** `./`

   Then click **Deploy**. You'll get a URL like `https://<project>.vercel.app`.
6. **Allow that URL in the backend.** In the backend's environment variables
   (e.g. Railway → Variables), set:
```
   CLIENT_ORIGIN=https://<project>.vercel.app
```
   Use `https://`, no trailing slash, and match the address exactly. Then
   redeploy/restart the backend so it picks the change up.
7. **Test it:** open the Vercel URL, register or log in, and check that
   courses load.

From then on, every push to the production branch (usually `main`) redeploys
the site automatically. If you add a custom domain in Vercel, update
`CLIENT_ORIGIN` to match.

Things to know:
- **Don't create a folder named `public`.** With the "Other" preset, Vercel
  serves `public/` *instead of* the project root whenever that folder exists.
  Use a name like `images/` for assets.
- **Preview deployments won't reach the API.** The backend's `CLIENT_ORIGIN`
  allows a single origin, so Vercel's per-branch/PR preview URLs get blocked by
  CORS unless you temporarily set `CLIENT_ORIGIN` to that URL.
- **Public sites and seeded accounts.** The backend README documents the
  seeded demo accounts and their shared password. Don't leave those on a
  database that a public site uses — delete them or change their passwords.

## Troubleshooting

- **CORS error in the console** — `CLIENT_ORIGIN` on the backend doesn't
  exactly match the address in your browser (protocol, host, port, or a
  trailing slash).
- **Pages keep sending you to the login screen** — your session is missing or
  the token has expired; log in again.
- **"Failed to fetch" or empty pages** — `API_BASE_URL` in `js/api.js` is wrong
  or the backend isn't running.
- **Login works but the data is empty** — the database hasn't been seeded (or
  you have no enrollments yet).

## Known limitations

- The client-side role check only exists on `admin-dashboard.html` (it sends
  non-admins away). `manage-courses`, `manage-course-modules`, and
  `module-editor` can be opened by any logged-in user, but every write they
  make is enforced by the backend, which returns `403` for non-admins.
- The register page's role selector doesn't do anything (see above).