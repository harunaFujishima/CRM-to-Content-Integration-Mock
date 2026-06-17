# Content Approval Workflow Simulator

A UML state machine for the promotional content lifecycle — draft, review, approval, distribution — implemented as a real, working web application. The same state model drives server-side validation, the REST API, and the diagram the UI renders, so there is exactly one definition of "what's legal" in this workflow.

**[Live demo →](https://mock-crm-xxxx.onrender.com)**

## UML state diagram

![Content lifecycle state diagram](docs/state-diagram.svg)

```
[*] → Draft → In review → Approved → Distributed → Withdrawn → [*]
                  │
                  ▼ reject [comment required]
               Rejected
                  │
                  ▼ revise
                Draft
```

Two of the transitions carry a guard condition, the UML notation for "this transition only fires if a condition holds": `reject` and `withdraw` both require a comment, modeling the real-world requirement that a rejection or a withdrawal has to be justified, not just clicked.

Each transition is also restricted to one role:

| Transition | From → To | Role required | Guard |
|---|---|---|---|
| `submit_for_review` | Draft → In review | author | — |
| `approve` | In review → Approved | reviewer | — |
| `reject` | In review → Rejected | reviewer | comment required |
| `revise` | Rejected → Draft | author | — |
| `distribute` | Approved → Distributed | publisher | — |
| `withdraw` | Distributed → Withdrawn | compliance | comment required |

## Architecture

```
backend/stateMachine.js   the UML model as data: states, transitions, guards
backend/data.js           in-memory content items + transition history
backend/server.js         REST API; validates every transition against stateMachine.js;
                           serves the built React app in production
frontend/src/             React UI: lifecycle diagram, content cards, role switcher
```

The frontend never decides on its own whether an action is allowed — it shows buttons for transitions the current role *should* be able to fire, but the server independently re-checks every guard on every request. Switching the "Acting as" role in the toolbar and trying an action that role doesn't own demonstrates this: the button isn't even shown, and if you call the API directly with the wrong role it comes back `409`.

## Tech stack

React (Vite) for the frontend, Node.js + Express for the backend and REST API, plain JavaScript for the state machine (no external workflow library — the point of the project is to show the modeling, not hide it behind a framework). No database; an in-memory store keeps the demo simple to run and deploy.

## Running locally

```bash
# Terminal 1 — backend (REST API)
cd backend
npm install
npm start                  # listens on port 5003

# Terminal 2 — frontend (dev server, proxies /api to the backend)
cd frontend
npm install
npm run dev                 # opens on port 5173
```

For a single combined process (closer to how it deploys):

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start    # now also serves frontend/dist at :5003
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5003` | Port the backend listens on |

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploy steps and troubleshooting notes.

## Why this maps to Vault PromoMats/MedComms

Vault PromoMats and MedComms exist to enforce exactly this kind of lifecycle on promotional and medical content — nothing reaches the field until it has cleared a defined review path, and every step has to be auditable. This project models that lifecycle explicitly as a state machine rather than scattering `if` statements through the codebase, which is what makes it possible to answer "can this content move from X to Y right now, and who's allowed to do it" with a single, inspectable source of truth instead of having to trace logic across the app.

## What I'd extend next

- Real authentication instead of a role dropdown, with the JWT/session carrying the role server-side.
- Persist items and history in Postgres instead of memory.
- Parallel review (multiple reviewers, all must approve) as a second branch in the state machine.
- A timeline/Gantt view across all items instead of per-item history only.
