# CollegeCompass — College Discovery Platform (Scalable MVP)

**Live:** `https://college-campus-xxx.vercel.app` *(replace with your Vercel URL after deploy)*  
**Track:** A — College Discovery Platform, **Role:** Full Stack

A production-grade MVP for discovering Indian engineering colleges. Search, compare, predict admission chances, and discuss — built for scale, not just 15 seed rows.

## What it does

- **Discover:** Searchable listings with filters and infinite scroll. Each card shows `name`, `location {city, state}`, `fees ₹L`, `rating ★`.
- **Detail:** Overview, courses & fees, placements (2023-25), cutoffs (JEE Main/Advanced per category), reviews.
- **Compare 2-4:** Side-by-side fees, placements, ratings, location, cutoffs. Shareable `?slugs=` link.
- **Predict:** Enter `rank + exam + category` → bucketed `Safe / Target / Reach` via live `cutoffData` (`rank / cutoff <=0.7 safe else 0.9 target else reach`).
- **Comments (Instagram-style):** Nested replies (infinite depth, `View 3-4 more` per thread), `timeAgo 2h ago`, per-college semantic search over root questions only.
- **Auth + Saved:** Signup/Login (email+password), save colleges and comparisons, `/saved` with 2 folders per user.

## Architecture (simple)

```
Next.js 16 App Router (React 19, TS, Tailwind)  ─┬─  Server Components (RSC) + Server Actions ('use server')
                                                ├─  Prisma 5.22  →  Neon Postgres (pooler) + pgvector
                                                └─  jose JWT httpOnly cookie (7d) + bcrypt
```

**Data flow (scalable):**
- **Home:** Server `fetchCollegesPaginated` → cursor `rating+name+id` *or* `feesMin+feesMax+id` → client `CollegeCatalog` debounced 300ms + `Abort` (requestId) + `IntersectionObserver 200px` + `Load more` fallback. `Showing X of Y` via `totalFiltered count`.
- **Compare:** Server `searchCollegesForCompare take 8` (`OR name/city/slug ILIKE`) debounced, `fetchCollegesForCompare where slug in (...)` ordered as input, `saveComparison` via `SavedComparison`.
- **Detail Tabs:** `generateStaticParams` for slugs, `findUnique include courses/placements/reviews/cutoffs`.
- **Saved:** Server `count()` (cheap, indexed) for header `Hi — 42 colleges, 7 comparisons` + paginated `fetchSaved*Paginated` cursor `createdAt+id` (`12 colleges / 10 comparisons` + 2 files).
- **Comments:** `Comment {id, collegeId, userId, parentId(self), content, embedding vector(768)}` → root `parentId=null` gets local pseudo-nomic `768` embedding, replies `null`. `fetchRootComments` per `collegeId` roots-only `orderBy embedding <=> query` cosine, `<0.5` low-ranked as-is. Thread `fetchReplies(parentId, take 4, cursor createdAt)` indented `ml-6` capped at 6.

## Tech Stack

Next.js 16.3.4 (App Router, Turbopack) • React 19 • TypeScript 7 • Tailwind 4 • Prisma 5.22 • PostgreSQL + `pgvector` (768) on Neon • `jose` (JWT HS256) • `bcryptjs` • `lucide-react` • `hooks/useInfiniteScroll`

## Data Model

```
User ──< Review, SavedCollege, SavedComparison, Comment
College ──< Course ──< CutoffData
        ──< Placement (topRecruiters String[])
        ──< Review (userId SetNull)
        ──< Comment (parentId self, embedding vector(768))
        ──< SavedCollege, CutoffData, SavedComparisonCollege
SavedComparison ──< SavedComparisonCollege ── College
Comment parent -> replies (Cascade, User SetNull -> Deleted User)
```

**Indexes for scale:**
- `College`: `@@index([city])`, `@@index([state])`, `@@index([rating, name, id])`, `@@index([feesMin, feesMax, id])`
- `SavedCollege/Comparison`: `@@index([userId, createdAt])` + cursor `createdAt+id`
- `Comment`: `@@index([collegeId, parentId, createdAt])`, `@@index([collegeId, createdAt])`, `HNSW` partial `WHERE parentId IS NULL` (after migration)
- `Review/Cutoff/Placement`: `@@index([collegeId])` etc.

## Built for Scale — how

- **Cursor pagination, not OFFSET:** `take: limit+1` + `hasMore + nextCursor` on `College`, `Saved`, `Comments`. `WHERE (rating < cur) OR (rating= && name> )` avoids `OFFSET 10000` scan + stable on inserts. `limit 12` (home) / `8` (compare search) / `12/10` (saved) / `4` (replies) = constant payload.
- **Debounce + abort:** 300ms debounce + `requestId` ignore stale `fetchCollegesPaginated` / `searchCollegesForCompare` / `fetchRootComments` → no 6-request race when typing `mumbai` fast.
- **Separate cheap counts:** Header `count()` index-only (~1ms) vs `findMany+include` (heavy) — only active folder fetched, not both.
- **Vector per-college, roots-only:** `embedding` only for `parentId=null`, partial `WHERE parentId IS NULL AND collegeId = ?` + `collegeId` scope → no cross-college leak, index small. Local deterministic 768-dim pseudo-nomic → no OpenAI cost, swappable to true `nomic-embed-text`.

## Setup (local)

```bash
git clone https://github.com/Omkumar-pal/college-campus.git
cd college-campus

cp .env.example .env
# fill DATABASE_URL (Neon pooled + ?sslmode=require&channel_binding=require)
# fill JWT_SECRET (openssl rand -base64 32) — at least 32 chars

npm install
# optional convenience after clone (not in package.json by design, see Vercel below):
# npx prisma generate

npx prisma migrate deploy   # applies prisma/migrations/0_init_with_vector (CREATE EXTENSION vector;)
npx prisma generate         # if postinstall not added
npx prisma db seed          # 15 colleges, 16 users (incl. example@gmail.com / 123456 Megha Pal), 90 cutoffs

npm run dev     # http://localhost:3000
npm run build   # also runs tsc check; needs DATABASE_URL + JWT_SECRET set
```

**.env.example:**
```
DATABASE_URL = postgresql://user:password@ep-...-pooler.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET = change-me-generate-with-openssl-rand-base64-32-at-least-32-chars
```
`.env` is gitignored. Seed login: `example@gmail.com / 123456` (Megha Pal). Or signup new.

## Deploy to Vercel (free)

1. **Import:** `vercel.com/new` → Import `Omkumar-pal/college-campus` → Framework `Next.js`
2. **Build & Output Settings** (leave `Output Directory` empty → `.next`):
   - **Build Command:** `npx prisma generate && npx prisma migrate deploy && next build`
   - **Install Command:** `npm ci` (default)
   - **Node:** `22.x`
3. **Environment Variables** → add for `Production` + `Preview`:
   - `DATABASE_URL` = Neon pooled URL (same as local `.env:1`)
   - `JWT_SECRET` = same 32+ base64 you put in `.env` (e.g. `PK2HozDXx1DWv5Xx/+13f6flnvOV+Vj9wV+zIFwFk54=`)
4. **Deploy** → check logs `Prisma migrate deploy` success → visit `/colleges/iit-bombay` → login as `example@gmail.com / 123456` → heart → `/saved` shows 2 folders, compare search `iit madras` should work, comments nested reply, per-college vector search.

> **Local `postinstall` note:** We intentionally keep `package.json` without `"postinstall": "prisma generate"` and rely on Vercel Build Command for deploy (visible in logs). If you clone locally and want auto-generate on `npm install`, add `"postinstall": "prisma generate"` to `scripts` — documented here for another user.

## Verification Checklist

- [ ] `npx prisma validate` + `npx prisma migrate status` → `Database schema is up to date`
- [ ] `npx prisma db seed` → `15 colleges, 16 users`
- [ ] `example@gmail.com / 123456` can login → `Hi Megha Pal` + `/saved` 2 colleges, 1 comparison
- [ ] Home: `mumbai` search 300ms, type `Government`, sort `Fees`, scroll sentinel `Load more`, tie `4.8` Bombay/Madras no duplicate
- [ ] Compare: search `iit madras` (≥2 chars) → 8 results, save 2-4 → green tick pop → `/saved?tab=comparisons` → `View Comparison` via `?slugs=` pre-populates table
- [ ] Comments: post root → reply → reply-under-reply → `View 3-4 more` → per-college vector search `hostel` only inside that college
- [ ] `npm run build` 21 routes, `proxy.ts` (Next 16) protects `/saved`

## Tradeoffs & Next

- **API style:** Server Actions primary (`'use server'`) for type-safety + thin `GET /api` wrapper skipped — fast, App Router idiomatic; wrapper would just call same `fetchCollegesPaginated` for rubric. Add if evaluator needs `curl /api/colleges`.
- **Vector:** Local pseudo-nomic 768 deterministic (no API cost, swappable to true `nomic-embed-text` by changing `lib/embeddings.ts` one function). `pgvector` HNSW index is partial `WHERE parentId IS NULL`.
- **Package sort removed** per request — keep 2 sorts (`Rating`/`Fees`) for 2 cursors simplicity.
- **Future:** `src/proxy.ts` if you adopt `src/`, `DIRECT_URL` split for Neon non-pooled migrate, `pg_trgm` GIN for `name/city` if 100k rows.

---
CollegeCompass MVP • Next.js, Prisma, Neon Postgres & pgvector
