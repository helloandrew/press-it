# PressIt 🔴

> Press the button. Release the stress.

PressIt is a minimal stress-relief web app. One big button. Click it when you need to. It tracks how many times you've pressed today and all time for an anonymous browser user.

---

## Tech Stack

- **Frontend:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Backend:** Next.js route handlers
- **Local DB:** SQLite via `better-sqlite3`
- **Production DB:** Vercel Postgres

---

## Local Development

```bash
cp .env.local.example .env.local
npm install
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — lint the app
- `npm run db:migrate` — apply `db/migrations/001_init.sql` to local SQLite

---

## Project Structure

```text
app/
  api/
    click/route.ts   # POST /api/click
    stats/route.ts   # GET /api/stats
  layout.tsx
  page.tsx
lib/
  db.ts              # SQLite/Postgres adapter selection
  taglines.ts        # rotating tagline pool
  user.ts            # localStorage UUID helper
db/
  migrations/
    001_init.sql
```

---

## Notes

- User identity is anonymous and stored in `localStorage`
- `today` is calculated from the user's local timezone offset
- Local SQLite DB file is created at `db/pressit.db`
