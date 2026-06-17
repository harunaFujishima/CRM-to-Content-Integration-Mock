# Deployment notes

This file holds the deploy steps for this project, kept separate from README.md so the README stays focused on what the project is and how it works.

## Deploying (free tier, ~10 minutes)

This is one deployable service once the frontend is built, since the backend serves the React build as static files:

1. Push this repo to GitHub.
2. On [Render](https://render.com): New Web Service → connect the repo.
3. Leave **Root Directory** blank (the build command below handles both folders from the repo root).
4. Make sure the **Language/Runtime** is set to **Node**, not Docker — this is selected on the very first setup screen. Render currently has no dashboard option to change this after the service is created; if it's wrong, delete the service and recreate it.
5. Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
6. Start command: `node backend/server.js`
7. Deploy — the public URL serves both the API and the dashboard.

Free tiers on Render spin down after inactivity, so the first request after a while can take 30-60 seconds to wake up. Hit the URL once yourself before showing it to anyone to "warm it up."

## Troubleshooting

**Blank page or 404 after deploy.** Usually means the build command didn't actually produce `frontend/dist` before the backend started, or Root Directory was set to `backend` or `frontend` instead of being left blank. The build command needs to run from the repo root so it can `cd` into both folders.

**Root Directory not found** (if you do set one). If the zip's outer folder is still present on GitHub (e.g. everything sits inside `content-approval-simulator/`), either include that folder in your paths or flatten the repo so `backend/` and `frontend/` sit at the top level.
