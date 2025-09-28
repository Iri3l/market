# MARKET — Autotrader-style marketplace (WIP)

**Goal:** allow people to list and browse cars/parts (no payments initially).

## Tech
- Backend: Node.js + Express + MongoDB
- Infra: AWS (Elastic Beanstalk + S3) — later
- Frontend: Next.js — later

## Monorepo Layout
- `api/` — backend service (this stage)
- `web/` — frontend app (later)
- `docs/` — roadmap + decision log

## Development
See `api/README.md` for local API instructions.
## Local endpoints
- `GET /` — simple status page
- `GET /health` — healthcheck
- `GET /api/listings` — list listings (supports filters)
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login (returns JWT)


## Roadmap
See `docs/roadmap.md`.
