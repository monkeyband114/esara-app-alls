# ESARA

Enhanced Staff Assessment Repository Architecture is a Next.js 15 application for evaluating academic staff research performance with bibliometric indicators.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives
- NextAuth credentials auth with JWT sessions and role-based access control
- Upstash Redis for users, publications, scores, settings, and audit logs
- OpenAlex-only publication retrieval with academic identity verification
- Recharts analytics dashboards
- Modular OpenAI-compatible research assistant

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in Upstash, NextAuth, and optional OpenAI values. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32` and use the same value in production.
3. Initialize settings: `npm run db:init`
4. Seed demo users: `npm run db:seed`
5. Run locally: `npm run dev`

Demo accounts are created automatically on first runtime startup when Redis is empty. Manual seeding uses the same data.

- `admin@esara.edu` / `Admin123@`
- `ict@esara.edu` / `ICT123@`
- `arnold.ojugo@esara.edu` / `Staff123@`
- `maureen.akazwe@esara.edu` / `Staff123@`
- `patrick.ejeh@esara.edu` / `Staff123@`

Publication records are imported from OpenAlex only. ESARA does not generate AI, prototype, or simulated publication records when OpenAlex has no matching data.

## Important Security Note

The original build brief included live-looking Redis credentials. Do not commit real secrets. Rotate any exposed Upstash tokens, then place fresh values only in `.env.local` or Vercel environment variables.

## Core Features

- Public institutional landing page at `/` with ESARA hero, platform sections, metrics showcase, and calls to action.
- Professional login at `/login` with role-aware routing:
  - Admin -> `/dashboard/admin`
  - ICT Personnel -> `/dashboard/ict`
  - Academic Staff -> `/dashboard/staff`
- Academic staff signup at `/signup`; public registration creates Academic Staff accounts only.
- First-time onboarding progress at `/onboarding`.
- OpenAlex research discovery and publication claiming workflow at `/research-discovery`.
- Institution-wide admin dashboard with staff counts, publication totals, verified publication counts, average SRS, total citations, trends, department performance, leaderboard, users, settings, and audit logs.
- ICT dashboard for publication validation, author confidence review, metadata correction workflow placeholders, and OpenAlex import API.
- Staff dashboard with personal metrics, h-index, SRS ranking, publication timeline, citation trend, quartile distribution, repository table, and AI guidance.
- Dedicated lecturer profile analytics at `/dashboard/staff/[id]`.
- Interactive leaderboard at `/dashboard/leaderboard` with search, department filtering, sorting, and pagination.
- Ranking engine orders academic staff by SRS, then citation count, then h-index, and stores rank labels such as `Rank 1 of 3`.
- Staff Research Score algorithm:

```text
SRS = 0.25 * publicationScore
    + 0.35 * citationScore
    + 0.25 * hIndexScore
    + 0.15 * journalQualityScore
```

- Identity verification combines Levenshtein distance and Jaro-Winkler similarity:
  - 95-100: Verified
  - 80-94: Likely Match
  - Below 80: Manual Review

## API Routes

- `POST /api/openalex/import` with `{ "userId": "..." }`, followed by automatic SRS and ranking recalculation
- `POST /api/signup`
- `GET /api/research-discovery?mode=author&q=name`
- `POST /api/publication-claims`
- `GET /api/search?q=keyword`
- `GET /api/reports/csv`
- `GET|POST /api/auth/[...nextauth]`

## Deployment

Deploy directly to Vercel, add the environment variables from `.env.example`, including a stable `NEXTAUTH_SECRET`, then run the seed script locally against the target Upstash instance or from a protected deployment job.
