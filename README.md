# leadgreet

Find the signal. Start the conversation. Make Business.

leadgreet is a Sales Intelligence platform. It scores publicly observed company signals, identifies relevant contacts, and turns them into explainable sales opportunities.

This repository is a standalone product. It has no dependency on CodeCamp:N (no logos, colors, copy, data, accounts, or shared infrastructure).

## This sprint

Included:

- Project structure (Next.js 15 App Router, TypeScript, Tailwind)
- PostgreSQL data model (Neon- and Vercel-compatible)
- REST API
- Explainable scoring engine
- Dashboard and detail views
- CRM port (stub only — no Moco)
- Acquisition port (disabled — no crawling)
- Marked demo seed data

Not included:

- Automated web crawling
- MOCO or any other CRM provider
- Authentication
- External AI research

## Local startup

Requirements: Node.js 20+, Docker (for local Postgres) or a Neon database.

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Neon

Set `DATABASE_URL` to your Neon connection string (include `sslmode=require`), then run the same Prisma migrate and seed commands. No code changes are required.

### Vercel

Connect the GitHub repository and set `DATABASE_URL` in the project environment. `prisma generate` runs as part of install via the Prisma client dependency.

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (local or Neon) |

Do not commit `.env`. There are no hard-coded credentials in source.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Scoring engine unit tests |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Load / refresh demo data (`isSeed = true`) |
| `npm run db:studio` | Prisma Studio |

## Architecture

```
src/lib/db          database access
src/lib/scoring     opportunity scoring (no UI imports)
src/lib/crm         CRM port (stub)
src/lib/acquisition future signal ingestion (disabled)
src/lib/validation  Zod request schemas
src/types           shared domain types
src/app             UI + API routes
```

Scoring weights live in `src/lib/scoring/weights.ts` and must sum to 100. Every opportunity score is stored with a human-readable explanation.

Seed records are flagged `isSeed`. Company names in the seed list are the only real-world identifiers; signals, contacts, and opportunities are synthetic demonstration data.
