# CRM → Content Platform Integration Mock

A working demo of the integration pattern that connects **Veeva CRM** (sales-side) with **Veeva Vault PromoMats/MedComms** (content platform): when a piece of content clears approval in the CRM, the content platform is notified automatically and distributes it to the field — no manual hand-off required.

This repo contains two independent backend services and one dashboard that visualizes the flow between them, end to end, in real time.

## Architecture

```
┌─────────────────┐        REST API           ┌──────────────────────┐
│    Mock CRM      │  POST /approvals/:id      │   Mock Content        │
│  (Veeva CRM)      │  /approve                  │   Platform             │
│                   │ ───────────────────────▶  │  (Vault PromoMats /   │
│  - approval list  │      webhook               │   MedComms)            │
│  - approve action │  POST /webhooks/           │  - distribution log    │
│                   │  crm-approval               │  - X-Webhook-Secret    │
│                   │  (X-Webhook-Secret header)  │    verification        │
└─────────────────┘                             └──────────────────────┘
        ▲                                                  ▲
        │                    REST polling                  │
        └──────────────────  Dashboard  ────────────────────┘
```

1. A rep "approves" a piece of content in the **Mock CRM** service (`POST /api/approvals/:id/approve`).
2. The CRM service immediately calls a **webhook** on the **Mock Content Platform** service (`POST /webhooks/crm-approval`), authenticated with a shared-secret header — the same pattern Vault webhook receivers use in production.
3. The Content Platform service validates the secret, writes a distribution record, and responds.
4. The CRM service stores the webhook delivery result against the approval record, so you can see exactly what happened (success, status code, timestamp).
5. The **dashboard** (static HTML/JS) polls both services' REST APIs and renders the CRM panel, the content platform panel, and a live request/response log in between.

## Tech stack

Node.js, Express, native `fetch` for the server-to-server webhook call, vanilla HTML/CSS/JS for the dashboard. No database — both services use an in-memory store, which keeps the demo simple to run and deploy while still exercising the real integration mechanics (HTTP, JSON payloads, auth headers, status codes).

## Running locally

```bash
# Terminal 1
cd mock-content-platform
npm install
npm start         # listens on port 4002

# Terminal 2
cd mock-crm
npm install
npm start         # listens on port 4001, serves the dashboard at http://localhost:4001
```

Open `http://localhost:4001` — that's the dashboard, served as a static file by the CRM service. It already points at `http://localhost:4002` for the content platform by default; the "Apply" button lets you repoint it (useful once both services are deployed to different URLs).

## Environment variables

| Service | Variable | Default | Purpose |
|---|---|---|---|
| mock-crm | `PORT` | `4001` | Port to listen on |
| mock-crm | `CONTENT_PLATFORM_WEBHOOK_URL` | `http://localhost:4002/webhooks/crm-approval` | Where to POST the webhook on approval |
| mock-crm | `WEBHOOK_SECRET` | `demo-shared-secret` | Shared secret sent in `X-Webhook-Secret` |
| mock-content-platform | `PORT` | `4002` | Port to listen on |
| mock-content-platform | `WEBHOOK_SECRET` | `demo-shared-secret` | Must match the CRM service's value |

## Deploying (free tier, ~10 minutes)

These two services are independent Node apps, so each deploys as its own Web Service. [Render](https://render.com) and [Railway](https://railway.app) both have a free/low-cost tier and a near-identical flow:

1. Push this repo to GitHub.
2. **Deploy `mock-content-platform` first:**
   - New Web Service → connect the repo → set **Root Directory** to `mock-content-platform`.
   - Build command: `npm install`. Start command: `npm start`.
   - Add env var `WEBHOOK_SECRET` (pick any string, e.g. `prod-demo-secret-123`).
   - Deploy, then copy the public URL it gives you (e.g. `https://mock-content-platform.onrender.com`).
3. **Deploy `mock-crm`:**
   - New Web Service → same repo → **Root Directory** `mock-crm`.
   - Build command: `npm install`. Start command: `npm start`.
   - Add env vars: `WEBHOOK_SECRET` (same value as step 2) and `CONTENT_PLATFORM_WEBHOOK_URL` set to `https://mock-content-platform.onrender.com/webhooks/crm-approval`.
   - Deploy, then copy its public URL.
4. Open the `mock-crm` public URL in a browser — that serves the dashboard. In the config bar at the top, set "Mock Content Platform API" to the `mock-content-platform` public URL (no trailing path) and click **Apply**.
5. Click **Approve** on any item — you'll see the webhook fire, the packet animate across the wire, and the item appear in the Content Platform panel, all on services running on the public internet.

Free tiers on Render spin down after inactivity, so the first request after a while can take ~30 seconds to wake up — that's expected, not a bug.

## Why this maps to the Veeva ecosystem

Veeva CRM and Veeva Vault PromoMats/MedComms are separate platforms that have to stay in sync: content approved for promotional use needs to reach the rep-facing CRM layer, and field activity needs to be visible back to the content/compliance side. In production this is handled through Veeva's own integration layer and webhook/API mechanisms; this project reproduces the same shape — two systems, a REST trigger, a webhook callback, and a shared-secret check — at a scale that's easy to read, run, and explain in an interview.

## What I'd extend next

- Persist state in a real database (Postgres) instead of in-memory, with a migration script.
- Add retry/backoff and a dead-letter queue for failed webhook deliveries.
- Add a second webhook direction (content platform → CRM) for "content expired/withdrawn" events.
- Swap the shared-secret header for HMAC payload signing, matching how many production webhook providers (including Veeva's own APIs) authenticate calls.
