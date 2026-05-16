# NeighbourFit AI — Technical Documentation

## Table of Contents

1. [Repository layout](#1-repository-layout)
2. [Database schema](#2-database-schema)
3. [OpenAPI contract and codegen](#3-openapi-contract-and-codegen)
4. [API routes reference](#4-api-routes-reference)
5. [Scoring engine](#5-scoring-engine)
6. [AI summary pipeline](#6-ai-summary-pipeline)
7. [Frontend architecture](#7-frontend-architecture)
8. [Authentication and sessions](#8-authentication-and-sessions)
9. [PDF report feature](#9-pdf-report-feature)
10. [Admin dashboard](#10-admin-dashboard)
11. [Adding a new neighbourhood](#11-adding-a-new-neighbourhood)
12. [Adding a new API endpoint](#12-adding-a-new-api-endpoint)
13. [Environment variables](#13-environment-variables)
14. [TypeScript and build system](#14-typescript-and-build-system)
15. [Common pitfalls](#15-common-pitfalls)

---

## 1. Repository layout

```
.
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── routes/          # Express route handlers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── compare.ts
│   │   │   │   ├── favorites.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── index.ts     # Router aggregator
│   │   │   │   ├── neighborhoods.ts
│   │   │   │   └── recommendations.ts
│   │   │   ├── lib/
│   │   │   │   ├── ai-summary.ts        # OpenAI integration + cache
│   │   │   │   ├── logger.ts            # pino logger singleton
│   │   │   │   ├── neighbourhood-data.ts # Static neighbourhood definitions
│   │   │   │   └── scoring.ts           # Deterministic scoring engine
│   │   │   └── index.ts         # Express app entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── neighbourfit/
│       ├── public/
│       │   └── calgary-bg.png   # Shared background image
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/      # NavBar, page shell
│       │   │   ├── neighborhood/ # RadarChart, detail cards
│       │   │   ├── report/      # ResultsPDF.tsx, ReportCheckoutModal.tsx
│       │   │   └── ui/          # shadcn/ui primitives
│       │   ├── hooks/           # Custom React hooks
│       │   ├── lib/
│       │   │   ├── neighbourhood-images.ts  # Image URL mapping
│       │   │   ├── questionnaire-store.ts   # localStorage persistence
│       │   │   └── utils.ts                 # cn(), COMMUTE_DISCLAIMER
│       │   ├── pages/
│       │   │   ├── admin/       # Dashboard + neighbourhood editor
│       │   │   ├── auth/        # Login + register
│       │   │   ├── neighborhoods/ # Browse + detail
│       │   │   ├── compare.tsx
│       │   │   ├── dashboard.tsx
│       │   │   ├── favorites.tsx
│       │   │   ├── history.tsx
│       │   │   ├── home.tsx
│       │   │   ├── questionnaire.tsx
│       │   │   ├── results.tsx
│       │   │   └── results-saved.tsx
│       │   ├── App.tsx          # Router + query client setup
│       │   └── index.css        # Tailwind + theme tokens
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── lib/
│   ├── api-client-react/        # Generated TanStack Query hooks (do not edit)
│   ├── api-spec/
│   │   └── openapi.yaml         # OpenAPI 3.1 spec — source of truth
│   ├── api-zod/                 # Generated Zod schemas (do not edit)
│   └── db/
│       ├── src/
│       │   ├── schema/          # One file per Drizzle table
│       │   └── index.ts         # Re-exports db client + all tables
│       └── drizzle.config.ts
│
├── scripts/                     # Utility scripts (@workspace/scripts)
├── pnpm-workspace.yaml          # Workspace package discovery + catalog pins
├── tsconfig.base.json           # Shared strict TS defaults
├── tsconfig.json                # Root solution file (libs only)
└── replit.md                    # Project overview + user preferences
```

---

## 2. Database schema

All tables are defined in `lib/db/src/schema/`. The Drizzle ORM client is exported from `lib/db/src/index.ts` and consumed by the API server.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `email` | text unique | |
| `passwordHash` | text | bcrypt, cost 12 |
| `role` | text | `'user'` or `'admin'` |
| `createdAt` | timestamp | |

### `neighborhoods` (Calgary communities)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `slug` | text unique | URL-safe identifier |
| `name` | text | Display name |
| `identity` | text | One-line character summary |
| `description` | text | Long-form description |
| `affordabilityScore` | integer | 1–5 |
| `walkabilityScore` | integer | 1–5 |
| `transitScore` | integer | 1–5 |
| `nightlifeScore` | integer | 1–5 |
| `safetyScore` | integer | 1–5 |
| `fitnessScore` | integer | 1–5 |
| `petFriendlinessScore` | integer | 1–5 |
| `medianRentalEstimate` | integer | CAD/month |
| `downtownCommuteEstimateMins` | integer | Driving minutes |
| `transitType` | text | e.g. `'CTrain + bus-focused'` |
| `urbanForm` | text | e.g. `'city-like'`, `'suburban'` |
| `density` | text | e.g. `'medium'`, `'low'` |
| `updatedAt` | timestamp | |

### `favorites`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `userId` | integer FK → users | |
| `neighborhoodId` | integer FK → neighborhoods | |
| `createdAt` | timestamp | |

Unique constraint on `(userId, neighborhoodId)`.

### `recommendations`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `userId` | integer FK → users | |
| `inputWeights` | jsonb | Normalised UserWeights object |
| `inputBudget` | integer | Monthly budget in CAD |
| `inputWorkplace` | text | Raw workplace string |
| `matches` | jsonb | Array of NeighbourhoodMatch results |
| `createdAt` | timestamp | |

### `aiSummaryCache`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `cacheKey` | text unique | `{neighbourhoodId}:{top3Bucket}:{promptVersion}` |
| `summary` | text | AI-generated narrative |
| `expiresAt` | timestamp | Now + 24 hours |
| `createdAt` | timestamp | |

---

## 3. OpenAPI contract and codegen

**Source of truth:** `lib/api-spec/openapi.yaml`

Do not edit generated files. The workflow is:

```
openapi.yaml
    └─ pnpm --filter @workspace/api-spec run codegen
            ├─ lib/api-client-react/src/generated/api.ts   (React Query hooks)
            └─ lib/api-zod/src/generated/api.ts            (Zod schemas)
```

The codegen tool is **Orval**. Configuration lives in `lib/api-spec/orval.config.ts`.

Generated hook names follow the pattern `use{OperationId}` for queries and `use{OperationId}` for mutations, e.g. `useListFavorites`, `useAddFavorite`, `useCreateRecommendation`.

Generated Zod schemas follow the pattern `{SchemaName}Schema`, e.g. `CreateRecommendationBodySchema`.

The API server imports Zod schemas from `@workspace/api-zod` to validate incoming request bodies.

---

## 4. API routes reference

All routes are mounted under `/api`. The server does not rewrite paths — the reverse proxy passes the full `/api/...` path to Express.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Start session |
| POST | `/api/auth/logout` | Session | Destroy session + clear cookie |
| GET | `/api/auth/me` | Optional | Returns current user or 401 |

### Neighbourhoods — `/api/neighborhoods`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/neighborhoods` | None | List all communities |
| GET | `/api/neighborhoods/:slug` | None | Single community detail |
| PATCH | `/api/neighborhoods/:id` | Admin | Update scores/description |

### Recommendations — `/api/recommendations`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/recommendations` | Optional | Run scoring + AI summaries |
| GET | `/api/recommendations/history` | Required | List saved sessions |
| GET | `/api/recommendations/:id` | Required | Single saved session |

### Favourites — `/api/favorites`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/favorites` | Required | List saved favourites |
| POST | `/api/favorites/:neighborhoodId` | Required | Add favourite |
| DELETE | `/api/favorites/:neighborhoodId` | Required | Remove favourite |

### Compare — `/api/compare`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/compare?slugs=a,b,c` | None | Side-by-side data for 2–3 slugs |

### Admin — `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Aggregate analytics |
| DELETE | `/api/admin/ai-cache` | Admin | Invalidate all AI summary cache |
| POST | `/api/neighborhoods/:id/ask` | None | Follow-up AI question for a neighbourhood |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Returns `{ ok: true }` |

---

## 5. Scoring engine

**File:** `artifacts/api-server/src/lib/scoring.ts`

The engine is fully deterministic — no randomness or AI.

### Step 1 — Normalise weights

The user's 7 priority sliders (0–100 each) are normalised so they sum to exactly 100. If all are zero, a default weight vector is used.

### Step 2 — Compute raw score per neighbourhood

For each neighbourhood:

```
rawScore = Σ (normalised_weight[dim] × f(neighbourhood_score[dim]))
```

Where `f(score)` maps the curated 1–5 integer rating to a 0–1 float via dimension-specific functions (some dimensions use simple linear scaling; others use adjusted curves — e.g. walkability factors in `urbanForm` and `transitType`).

### Step 3 — Convert to 0–100 compatibility score

```
compatibilityScore = Math.round(rawScore)          // already on a 0–100 scale
```

### Step 4 — Attach fit label

| Range | Label |
|---|---|
| 85–100 | Excellent fit |
| 70–84 | Strong fit |
| 50–69 | Moderate fit |
| 30–49 | Weak but possible fit |
| < 30 | Excluded |

### Step 5 — Affordability warning

If `neighbourhood.medianRentalEstimate > user.monthlyBudget`, `affordabilityWarning = true` is attached to the match.

### Step 6 — Sort and truncate

Results are sorted descending by `compatibilityScore`. Matches below 30 are removed. The top 5 are returned.

### Dimension breakdown

Each match includes a `dimensionBreakdown` array:

```ts
{
  key: string;           // e.g. "walkability"
  label: string;         // e.g. "Walkability"
  score: number;         // neighbourhood's raw 1–5 rating
  weight: number;        // user's normalised weight for this dimension
  contribution: number;  // score × weight, represents share of final result
}
```

---

## 6. AI summary pipeline

**File:** `artifacts/api-server/src/lib/ai-summary.ts`

### Cache key

```
{neighbourhoodId}:{top3WeightBucket}:{promptVersion}
```

The `top3WeightBucket` is derived from the user's top 3 weighted dimensions (sorted by weight, joined with `:`). This means users with similar priorities share a cached summary, minimising OpenAI spend.

### TTL

24 hours. Expired entries are ignored on read and overwritten on the next request.

### Prompt

The prompt asks GPT-4o-mini for a 2–3 sentence first-person narrative explaining why this neighbourhood suits someone with the given top priorities. The prompt explicitly instructs the model not to invent or fabricate numeric scores.

### Graceful degradation

If `OPENAI_API_KEY` is not set, or if the API call fails, `aiSummary` is `null` and `aiSummaryError` is `true` in the response. The frontend renders a fallback message in place of the AI narrative.

### Cache invalidation

Admin users can invalidate the entire cache via `DELETE /api/admin/ai-cache`. Individual entries expire automatically.

---

## 7. Frontend architecture

**Framework:** React 18 + Vite + TypeScript  
**Routing:** wouter (lightweight client-side router)  
**Data fetching:** TanStack Query v5 with generated hooks from `@workspace/api-client-react`  
**Styling:** Tailwind CSS v4, shadcn/ui component primitives  
**Animations:** Framer Motion

### Routing table

| Path | Component | Notes |
|---|---|---|
| `/` | `home.tsx` | Landing page |
| `/questionnaire` | `questionnaire.tsx` | 4-step form with localStorage persistence |
| `/results` | `results.tsx` | Match results + AI summaries + PDF export |
| `/results/:id` | `results-saved.tsx` | Saved recommendation view |
| `/explore` | `neighborhoods/index.tsx` | Searchable neighbourhood grid |
| `/explore/:slug` | `neighborhoods/detail.tsx` | Full neighbourhood detail |
| `/compare` | `compare.tsx` | Side-by-side comparison |
| `/dashboard` | `dashboard.tsx` | Authenticated user home |
| `/favourites` | `favorites.tsx` | Saved favourites |
| `/history` | `history.tsx` | Past recommendations |
| `/admin` | `admin/index.tsx` | Admin overview |
| `/admin/neighborhoods` | `admin/neighborhoods.tsx` | Score editor |
| `/login` | `auth/login.tsx` | |
| `/register` | `auth/register.tsx` | |

### Questionnaire persistence

`artifacts/neighbourfit/src/lib/questionnaire-store.ts` serialises and deserialises the questionnaire answers to `localStorage` so that progress survives a page refresh.

### Optimistic updates

The favourites feature uses TanStack Query optimistic updates on both the browse grid and the detail page:

1. On save/unsave, the local cache is updated immediately with `queryClient.setQueryData`.
2. If the API call fails, the cache is rolled back to the previous snapshot.

### Theme

Defined in `artifacts/neighbourfit/src/index.css`. The palette is a teal/slate civic SaaS theme:

| Token | Value | Usage |
|---|---|---|
| Mint accent | `#00cc99` | CTAs, highlights, progress bars |
| Slate 950 | `#020617` | Results page background |
| Slate 800 | `#1e293b` | Cards, panels |
| Background image | `/calgary-bg.png` | Auth, dashboard, admin, history, favourites pages |

---

## 8. Authentication and sessions

**Strategy:** `express-session` with a PostgreSQL session store + `bcrypt` password hashing (cost factor 12).

Sessions are stored server-side. The client holds only a session cookie (`neighbourfit.sid`).

### Session lifecycle

1. `POST /api/auth/login` — verifies password, calls `req.session.regenerate()`, sets `req.session.userId`.
2. All protected routes check `req.session.userId`; return 401 if absent.
3. `POST /api/auth/logout` — calls `req.session.destroy()`, then clears the cookie in the callback.

### Role-based access

The `users.role` column is either `'user'` or `'admin'`. Admin middleware checks `req.session.userId` → fetches user from DB → asserts `role === 'admin'`.

### Frontend auth state

`useGetMe` (generated hook) is called on mount. The result is used throughout the app to show/hide authenticated features. On logout, the query client cache is cleared immediately via `queryClient.setQueryData` + `queryClient.removeQueries`.

---

## 9. PDF report feature

**Files:**
- `artifacts/neighbourfit/src/components/report/ResultsPDF.tsx` — PDF document
- `artifacts/neighbourfit/src/components/report/ReportCheckoutModal.tsx` — checkout modal
- Entry point: `results.tsx` — "Get Report — $3.00" button in the left panel footer

### Flow

1. User clicks "Get Report — $3.00" on the results page.
2. `ReportCheckoutModal` opens with a checkout form (cardholder name, card number, expiry, CVV).
3. A "Demo mode" notice makes clear no real charge occurs.
4. On submit, the modal simulates a 2.2-second processing delay, then shows a success screen.
5. Clicking "Download PDF Report" calls `pdf(<ResultsPDFDocument />).toBlob()` client-side and triggers a file download as `neighbourfit-report.pdf`.

### PDF contents

- Branded header with generation timestamp
- All match cards (rank badge, name, score bar, fit label, affordability warning, rent estimate, commute time)
- Per-dimension score breakdown (7 dimensions, colour-coded bars)
- AI lifestyle insight (if available)
- Commute disclaimer and accuracy disclaimer
- Page numbers in the footer

### Integrating real payments

To replace the demo flow with real Stripe:

1. Add Stripe via the Replit integrations panel.
2. Create a Payment Intent server-side (`POST /api/payments/report-intent`).
3. Replace the mock `handlePay` in `ReportCheckoutModal.tsx` with Stripe Elements and `stripe.confirmPayment`.
4. Trigger the download only after the Payment Intent reaches `succeeded` status.

---

## 10. Admin dashboard

Accessible at `/admin` by users with `role = 'admin'`.

### Promoting a user

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Features

| Feature | Route | Notes |
|---|---|---|
| Analytics overview | `/admin` | Total users, recommendations, favourites, top neighbourhoods |
| Neighbourhood score editor | `/admin/neighborhoods` | Edit 1–5 scores and description per community |
| AI cache invalidation | Button on `/admin` | Calls `DELETE /api/admin/ai-cache` |

---

## 11. Adding a new neighbourhood

1. **Insert into the database** via the admin UI or directly via SQL:

```sql
INSERT INTO neighborhoods (slug, name, identity, description, ...)
VALUES ('kensington', 'Kensington', 'Trendy inner-city village', '...', ...);
```

2. **Add a neighbourhood image mapping** in `artifacts/neighbourfit/src/lib/neighbourhood-images.ts`:

```ts
kensington: "https://images.unsplash.com/...",
```

3. **Verify** the neighbourhood appears in the browse grid and comparison tool.

No code changes to the scoring engine are needed — it reads scores from the database.

---

## 12. Adding a new API endpoint

1. **Add the path and schema to `lib/api-spec/openapi.yaml`.**

2. **Run codegen:**

```bash
pnpm --filter @workspace/api-spec run codegen
```

3. **Add the route handler** in `artifacts/api-server/src/routes/`:

```ts
// Import the generated Zod schema for request validation
import { MyRequestBodySchema } from "@workspace/api-zod";

router.post("/my-endpoint", async (req, res) => {
  const body = MyRequestBodySchema.parse(req.body);
  // ...
  res.json(result);
});
```

4. **Register the router** in `artifacts/api-server/src/routes/index.ts` if it's a new file.

5. **Use the generated hook** in the frontend:

```ts
import { useMyEndpoint } from "@workspace/api-client-react";
const mutation = useMyEndpoint();
```

---

## 13. Environment variables

| Variable | Required | Where used | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `@workspace/db`, API server | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | API server | Long random string; keep secret |
| `OPENAI_API_KEY` | Yes | `ai-summary.ts` | AI narrative summaries |
| `MAPBOX_ACCESS_TOKEN` | No | `map.tsx` | Only needed for the map view |
| `PORT` | Injected | API server, Vite | Set by the workflow runner |
| `BASE_PATH` | Injected | Vite | Set by the workflow runner |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | `ai-summary.ts` | Replit AI proxy override |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | `ai-summary.ts` | Replit AI proxy key |

---

## 14. TypeScript and build system

### Composite libs (declaration emit)

`lib/api-client-react`, `lib/api-zod`, and `lib/db` are composite packages. They emit `.d.ts` declarations via `tsc --build` and are referenced by the root `tsconfig.json`.

Run:

```bash
pnpm run typecheck:libs   # build libs only
pnpm run typecheck        # full check: libs + all leaf packages
```

### Leaf packages (no emit)

`artifacts/api-server` and `artifacts/neighbourfit` are leaf packages. They import from libs by package name and are checked with `tsc --noEmit`.

### API server build

The API server is bundled to a single CJS file by esbuild:

```bash
pnpm --filter @workspace/api-server run build
```

The output is `artifacts/api-server/dist/index.cjs`.

### Vite (frontend build)

```bash
pnpm --filter @workspace/neighbourfit run build
```

Outputs to `artifacts/neighbourfit/dist/`.

---

## 15. Common pitfalls

| Pitfall | Fix |
|---|---|
| Changed the OpenAPI spec but hooks/schemas are stale | Run `pnpm --filter @workspace/api-spec run codegen` |
| API server can't import `@workspace/db` | Run `pnpm run typecheck:libs` to rebuild lib declarations |
| Frontend can't reach the API | Check that the reverse proxy is running and the API server is bound to `PORT` |
| `pnpm run dev` at workspace root fails | Use per-package commands or Replit workflows |
| AI summaries are stale after editing scores | Invalidate the cache from the admin dashboard |
| New user can't access admin routes | Run the `UPDATE users SET role = 'admin'` SQL command |
| TypeScript errors in admin/history/compare/favourites pages | These are known pre-existing errors; do not fix unless explicitly asked |
| Git push blocked by secret scanning | Remove the offending file from git history or use the GitHub bypass link |
