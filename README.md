# Springboard Admin Portal

A standalone, dependency-free admin portal based on the supplied Figma prototype. It is independent of the HMS project.

## Run

Start the backend in its own terminal:

```text
cd backend
npm start
```

The backend terminal prints a clickable status link: <http://127.0.0.1:5500/api/status>. Opening that link displays the active port. The frontend dashboard remains at <http://127.0.0.1:5500>.

The app uses the Node.js built-in HTTP server and does not require `npm install`.

In a second terminal, open the frontend from its folder:

```text
cd frontend
npm start
```

The frontend command prints its own ready message and opens the running backend URL in your browser. If the backend uses another URL, set `APP_URL` before starting the frontend.

## Project structure

- `frontend/` — HTML pages, stylesheets, browser scripts, and assets
- `backend/` — Node.js HTTP server that serves the frontend
- `package.json` — root-level start script

## Workspace

- `/` — admin dashboard
- `/users` — user-management actions
- `/users/new` — create a user (three screens)
- `/users/list` — search, edit, and delete users
- `/courses` — course-management actions
- `/courses/new` — create a course using the course fields
- `/courses/list` — search and view saved courses
- `/course-admin` — existing course dashboard and course builder
- `/details` and `/settings` — course creation steps

The user list currently uses local sample data as a UI placeholder; it is ready for DynamoDB-backed loading. New course records are stored locally for the course-list UI. The existing course admin retains its three-step builder, inline validation, live student preview, draft saving, and publish confirmation.
