# NeighbourFit AI

> Find the Calgary neighbourhood that fits how you actually live.

NeighbourFit AI is a full-stack lifestyle matching web app that helps people discover the right Calgary community based on their priorities — budget, walkability, transit, nightlife, safety, fitness access, and more. A deterministic scoring engine ranks neighbourhoods; OpenAI generates personalised narrative summaries.

---

## About This Project

NeighbourFit AI was developed as part of the **ENTI 333/633 Block Week course** at the **University of Calgary**, Haskayne School of Business. The project was built over a concentrated block week sprint, combining entrepreneurial thinking with full-stack software development to produce a working, deployable product.

### Team

| Name | Stream |
|---|---|
| Simrat Dhillon | Graduate |
| Iteoluwakisi Adejuwon | Graduate |
| Rethika Rajeev | Graduate |
| Mariesa Cummings | Graduate |
| Gurjit Samra | Undergraduate |
| Derrick Martin | Undergraduate |

---

## Features

- **8-step questionnaire** — monthly budget slider, 7 priority sliders, workplace location selector, and a review step
- **Ranked results** — top 5 neighbourhood matches scored by weighted compatibility, with fit labels and affordability warnings
- **AI lifestyle insights** — GPT-4o-mini narrative summaries per match, cached in PostgreSQL for 24 hours
- **Neighbourhood browser** — searchable, filterable grid of all 10 Calgary communities
- **Side-by-side comparison** — compare 2–3 neighbourhoods across every scored dimension
- **Favourites** — authenticated users can save and revisit neighbourhoods
- **Recommendation history** — saved sessions viewable any time after sign-in
- **PDF report** — $3.00 demo checkout flow that generates and downloads a full PDF of your results
- **Admin dashboard** — analytics overview, score editing, description editing, and AI cache invalidation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24, TypeScript 5.9 |
| Monorepo | pnpm workspaces |
| API server | Express 5, express-session, bcrypt |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (v4), drizzle-zod |
| API contract | OpenAPI 3.1 → Orval codegen |
| Frontend | React + Vite, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query |
| AI | OpenAI gpt-4o-mini with PostgreSQL response caching |
| PDF | @react-pdf/renderer |
| Build | esbuild (CJS bundle for API) |

---

## Check it out here

https://neighbour-fit-ai.replit.app

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express API (routes, scoring engine, AI)
│   └── neighbourfit/        # React + Vite frontend
├── lib/
│   ├── api-client-react/    # Generated TanStack Query hooks
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-zod/             # Generated Zod request/response schemas
│   └── db/                  # Drizzle ORM schema + migrations
├── scripts/                 # Utility scripts
├── pnpm-workspace.yaml
└── replit.md                # Project overview and user preferences
```

---

## Architecture

### Scoring engine

All neighbourhood scores are **deterministic and curated** — no AI is involved in scoring. The engine in `artifacts/api-server/src/lib/scoring.ts` works as follows:

1. Each Calgary neighbourhood has static 1–5 ratings across 7 dimensions (affordability, walkability, transit, nightlife, safety, fitness, pet-friendliness).
2. The user's priority sliders produce a weight vector that is normalised to sum to 100.
3. A weighted dot product is computed for each neighbourhood and converted to a 0–100 compatibility score.
4. Matches below 30 are excluded. The top 5 are returned.
5. If the neighbourhood's median rent exceeds the user's budget, an affordability warning is attached.

### AI summaries

`artifacts/api-server/src/lib/ai-summary.ts` calls GPT-4o-mini to generate a 2–3 sentence lifestyle narrative for each match. Summaries are cached in PostgreSQL keyed on `(neighbourhood_id, top3_weight_bucket)` with a 24-hour TTL to minimise API spend. If OpenAI is unavailable the API returns results without summaries gracefully.

### API contract

All API contracts are defined in `lib/api-spec/openapi.yaml` first. Orval reads the spec and generates:

- `lib/api-client-react/src/generated/api.ts` — typed TanStack Query hooks for the frontend
- `lib/api-zod/src/generated/api.ts` — Zod schemas used by the API server for request/response validation

Never edit the generated files directly. Always update the OpenAPI spec first, then re-run codegen.

### Authentication

Session-based auth using `express-session` + `bcrypt`. There are no JWTs. Guest users get recommendation results in-memory only; authenticated users have results persisted to the database.

---

## Fit Labels

| Score | Label |
|---|---|
| 85–100 | Excellent fit |
| 70–84 | Strong fit |
| 50–69 | Moderate fit |
| 30–49 | Weak but possible fit |
| < 30 | Excluded from results |

---

## Admin Access

After registering an account, promote it to admin via SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

The admin dashboard is then accessible at `/admin`.

---

## Important Notes

- **Scores are not AI-generated.** They are hand-curated estimates intended as an MVP baseline, subject to revision.
- **Commute estimates assume a downtown Calgary destination.** This disclaimer appears wherever commute times are shown. For other workplaces, users should use Google Maps.
- **British spellings** are used throughout the UI (`neighbourhood`, not `neighborhood`).
- `pnpm run dev` at the workspace root does **not** work — use the per-package commands above.
- After editing the OpenAPI spec, always run codegen before touching any frontend or API route code.

---

## Licence

MIT
