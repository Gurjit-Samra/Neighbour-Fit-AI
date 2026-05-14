# NeighbourFit AI

Find the Calgary neighbourhood that fits how you actually live — a full-stack lifestyle matching app using a deterministic scoring engine and AI-generated narrative summaries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/neighbourfit run dev` — run the React frontend (port 20938)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcrypt
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + wouter + TanStack Query
- AI: OpenAI gpt-4o-mini with PostgreSQL response caching (24h TTL)
- Build: esbuild (CJS bundle for API)

## Where things live

- **DB schema**: `lib/db/src/schema/` — one file per table
- **OpenAPI spec**: `lib/api-spec/openapi.yaml` — source of truth for API contracts
- **Generated hooks**: `lib/api-client-react/src/generated/api.ts`
- **Generated Zod schemas**: `lib/api-zod/src/generated/api.ts`
- **Scoring engine**: `artifacts/api-server/src/lib/scoring.ts` — deterministic, no AI
- **AI summary**: `artifacts/api-server/src/lib/ai-summary.ts` — OpenAI + DB cache
- **Frontend pages**: `artifacts/neighbourfit/src/pages/`
- **Theme**: `artifacts/neighbourfit/src/index.css` — teal/slate civic SaaS palette

## Architecture decisions

- Scores are **deterministic** (static curated 1–5 ratings per neighbourhood) — AI is used only for narrative summaries, never for generating numeric scores
- Session-based auth (express-session + bcrypt) rather than JWT — simpler for a classroom prototype
- AI summaries are cached per (neighbourhood × top-3 weight bucket) for 24 hours to minimise OpenAI spend
- All API contracts go through OpenAPI spec → Orval codegen first; server routes consume the generated Zod schemas for validation
- Recommendations are saved to DB only when authenticated; guest sessions get results in-memory

## Product

- **Questionnaire** (4 steps): budget slider, 7 priority sliders, workplace selector, review
- **Results**: top 5 matches ranked by weighted compatibility score, with AI narrative summaries
- **Neighbourhood browser**: searchable grid of all 10 Calgary communities
- **Comparison tool**: side-by-side score table for 2–3 neighbourhoods
- **Favourites**: authenticated users can save and revisit neighbourhoods
- **History**: saved recommendation sessions viewable by authenticated users
- **Admin dashboard**: analytics overview + score/description editing + AI cache invalidation

## User preferences

- British spellings: "neighbourhood", not "neighborhood" (in UI copy)
- Commute disclaimer must appear everywhere commute times are shown: "Commute estimate assumes a downtown Calgary destination. For other workplaces, use Google Maps."
- Fit labels: 85–100 = Excellent fit, 70–84 = Strong fit, 50–69 = Moderate fit, 30–49 = Weak but possible fit; below 30 excluded
- Scores are NOT AI-generated — they are curated MVP estimates, subject to change

## Gotchas

- Admin user must be manually set to `role = 'admin'` after registration (via SQL or the DB tool): `UPDATE users SET role = 'admin' WHERE email = 'admin@neighbourfit.ca'`
- `pnpm run dev` at workspace root does NOT work — use workflow commands above
- After changing the OpenAPI spec, always run codegen before touching frontend or backend route code
- The `@workspace/db` package must be built (`tsc --build`) before the API server can import it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Calgary neighbourhoods are seeded from the database; the full set of communities is managed via the admin dashboard or direct DB inserts
