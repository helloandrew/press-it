# PressIt 🔴

> Press the button. Release the stress.

PressIt is a minimal stress-relief web app. One button. Click it when you need to. It tracks how many times you've pressed today and all time.

---

## Project Status

🟡 Phase 0 — Setup in progress

---

## Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Next.js API Routes
- **Database:** SQLite (local dev via `better-sqlite3`) → Vercel Postgres (production)
- **Deployment:** Vercel (free tier) — public URL at `press-it.vercel.app`
- **Repo:** GitHub (monorepo)

---

## Local Development

> Setup instructions will be added in Phase 1 (Architecture).

---

## Folder Structure

```
press-it/
├── app/                  # Next.js App Router pages + components
│   ├── page.tsx          # Main page (the button)
│   ├── layout.tsx        # Root layout
│   └── api/
│       ├── click/        # POST /api/click — record a click
│       └── stats/        # GET /api/stats — fetch today + all-time counts
├── components/           # Reusable UI components (Button, CounterDisplay)
├── lib/                  # Shared utilities
│   ├── db.ts             # Database client (SQLite local / Postgres deployed)
│   └── user.ts           # UUID generation + localStorage helpers
├── db/
│   └── migrations/       # SQL schema migrations
├── public/               # Static assets
├── .env.local.example    # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Roadmap

- [x] Phase 0 — Repo setup + skeleton
- [ ] Phase 1 — Architecture brief (Ling Long)
- [ ] Phase 2 — Visual brief (Theo → Ling Long)
- [ ] Phase 3 — Build (Ling Long)
- [ ] Phase 4 — QA (Jamal Jr.)
- [ ] Phase 5 — Deploy to Vercel
- [ ] Phase 6 — UAT sign-off (Andrew)

---

## Team

| Role | Agent |
|------|-------|
| Coordination | Nico |
| Dev | Ling Long |
| Research / Design Brief | Theo Sniff |
| QA | Jamal Jr. |
| Product | Andrew |
