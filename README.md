# Booked

Recreating the original Amazon bookstore concept: a shop **and** a lending library in one app.

```
booked/
  backend/     Flask REST API + PostgreSQL (see backend/README.md)
  frontend/    React + Redux Toolkit client (see frontend/README.md)
```

## Quick start

1. **Backend** — `cd backend`, follow `backend/README.md` (creates the Postgres DB, runs migrations, seeds demo data, starts on port 5000).
2. **Frontend** — `cd frontend`, `npm install && npm run dev` (starts on port 5173, proxies `/api` to the backend).
3. Log in with the seeded admin (`admin@booked.com` / `admin123`) to reach `/admin`, or the demo user (`reader@booked.com` / `reader123`) for the shopper experience.

## Roles

- **Admin** — auth, add/update/delete books, approve/reject purchase orders, approve/reject lending requests, confirm returns, view everything.
- **User** — auth, browse shop/library, search & filter, separate purchase/lending carts, checkout, pay once approved, initiate returns, view order/lending history.

## Roadmap note

This Phase-1-complete build already includes its own Flask + PostgreSQL backend rather than a public API, since "Booked" is the full capstone concept. If you're also working through the separate 3-phase capstone rubric (Phase 1: public-API React app → Phase 2: add Flask+Postgres → Phase 3: add auth), treat this repo as a reference for what a completed Phase 3 looks like, and we'll walk through scoping your own phased build next.
