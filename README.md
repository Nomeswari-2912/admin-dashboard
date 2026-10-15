# Springboard Admin Portal

A standalone, dependency-free admin portal based on the supplied Figma prototype. It is independent of the HMS project.

## Run

From this folder, run:

```text
npm start
```

Then open <http://127.0.0.1:5500>.

The app uses the Node.js built-in HTTP server and does not require `npm install`.

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
