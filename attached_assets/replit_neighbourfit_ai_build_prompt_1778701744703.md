# Replit Build Prompt — NeighbourFit AI

## Role

You are an expert senior full-stack software engineer, product-minded architect, and Replit implementation specialist.

Build a polished, scalable MVP for **NeighbourFit AI**, an AI-powered neighborhood lifestyle matching platform for Calgary, Alberta.

Use the attached PRD as the authoritative product source, but make these architecture decisions:

1. Use **Replit's built-in database / Replit PostgreSQL** instead of Supabase.
2. Use **database-seeded, admin-editable neighborhood scores** as the source of truth.
3. Do **not** let AI generate the actual neighborhood ratings.
4. Use AI only for natural-language explanations, summaries, and tradeoff descriptions.
5. Keep the recommendation engine deterministic, auditable, and explainable.

This should be a real full-stack Replit app, not a throwaway prototype.

---

# Product Summary

NeighbourFit AI helps young professionals, students, newcomers, and remote workers choose Calgary neighborhoods based on lifestyle fit instead of only rent, square footage, or listing availability.

The app asks users lifestyle questions, scores Calgary neighborhoods using a deterministic weighted formula, and returns the top neighborhood matches with AI-generated explanations.

The MVP should validate this core product hypothesis:

> People relocating to Calgary need help understanding which neighborhood fits how they actually want to live.

---

# Key Architecture Decision: Neighborhood Scores

## Source of truth

Neighborhood scores must come from a **curated database seed dataset**, not live AI-generated ratings.

The app should seed the Calgary neighborhood data from the PRD into the database. These scores are manually curated product assumptions for the MVP and must be editable by admins.

Do **not** hard-code scores inside React components.

Do **not** call OpenAI to decide whether Beltline is 5/5 for nightlife or Seton is 5/5 for affordability.

The correct architecture is:

```text
Database-stored neighborhood scores = source of truth
Deterministic scoring engine = ranking logic
AI summaries = explanation layer
Admin dashboard = score maintenance layer
Future APIs = evidence layer, not automatic truth
```

## Why scores should not be AI-generated in MVP

The recommendation experience must be:

- Explainable
- Deterministic
- Auditable
- Testable
- Easy to debug
- Easy to defend in a classroom demo
- Safe from hallucinated neighborhood claims

If AI generates the underlying scores, the system becomes unpredictable and harder to trust. A user should be able to see exactly why they received a 92% compatibility score.

AI may summarize structured data, but it must not create the final numeric source-of-truth scores.

## Future-ready architecture

Design the data model so a future version can support score evidence.

Future version concept:

```text
Manual baseline score
+ API-supported evidence
+ AI-assisted research summary
+ admin approval
= published neighborhood score
```

For this MVP, build the foundation by storing editable scores and optional score notes/evidence fields in the database.

---

# Required Technology Stack

## Frontend

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form or equivalent
- Zod for validation
- Recharts or lightweight custom visualizations
- Lucide React icons
- Mobile-first responsive design

## Backend

Use:

- Node.js
- Express
- TypeScript
- REST API architecture
- Server-side scoring engine
- Server-side OpenAI integration
- Server-side session handling
- Bcrypt password hashing
- Secure cookie or JWT-based authentication

## Database

Use:

- Replit PostgreSQL / Replit built-in database if available
- Use Drizzle ORM or Prisma
- If Replit PostgreSQL is unavailable, use SQLite only as a local development fallback
- Do not use Supabase
- Do not use Firebase

## AI

Use:

- OpenAI API
- Model: `gpt-4o-mini`
- API key stored only in server-side environment variables
- Never expose API keys to the frontend

---

# Folder Structure

Use this structure or a clean equivalent:

```text
/
  client/
    src/
      components/
        common/
        questionnaire/
        recommendations/
        neighborhoods/
        comparison/
        auth/
        admin/
      pages/
      routes/
      hooks/
      lib/
      types/
      styles/
  server/
    src/
      routes/
      controllers/
      services/
        authService.ts
        recommendationService.ts
        scoringService.ts
        aiSummaryService.ts
        cacheService.ts
        adminService.ts
        analyticsService.ts
      middleware/
      db/
      models/
      seed/
      utils/
      validators/
  shared/
    types/
    constants/
    schemas/
```

Separate responsibilities clearly:

- React components should not contain business logic.
- Backend route handlers should call service-layer functions.
- The scoring engine should be isolated and unit-testable.
- AI summary generation should be separate from scoring.
- Database schema should be centralized.
- Shared types should be reused across frontend and backend.

---

# Environment Variables

Use these environment variables:

```text
DATABASE_URL
OPENAI_API_KEY
SESSION_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
NODE_ENV
```

Never expose `OPENAI_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, or admin credentials to the frontend.

---

# Database Schema

Design a normalized relational schema.

## users

Fields:

- id
- email
- passwordHash
- role: `user` or `admin`
- createdAt
- updatedAt
- lastLoginAt

Rules:

- Passwords must be hashed with bcrypt.
- Admin role cannot be self-assigned.
- Seed one admin user from environment variables.

## neighborhoods

Fields:

- id
- city
- name
- slug
- identity
- description
- affordabilityScore
- walkabilityScore
- transitScore
- nightlifeScore
- safetyScore
- fitnessScore
- petFriendlinessScore
- affordabilityScoreNote
- walkabilityScoreNote
- transitScoreNote
- nightlifeScoreNote
- safetyScoreNote
- fitnessScoreNote
- petFriendlinessScoreNote
- medianRentalEstimate
- downtownCommuteEstimateMins
- populationDensityClass: `urban`, `mixed`, or `suburban`
- lifestyleTags
- lastReviewedDate
- createdAt
- updatedAt

Important:

- Include `city`, defaulting to `Calgary`, so future city expansion is easier.
- Score note fields are optional but useful for credibility and admin review.
- All score fields must be integers from 1 to 5.

## recommendationSessions

Fields:

- id
- userId nullable
- guestSessionId nullable
- inputWeights JSON
- normalizedWeights JSON
- budget
- workplaceNeighborhood nullable
- usedDefaultWeights boolean
- results JSON
- createdAt

## favorites

Fields:

- id
- userId
- neighborhoodId
- createdAt

Rules:

- Add a unique constraint on `userId + neighborhoodId`.

## aiSummaryCache

Fields:

- id
- cacheKey
- neighborhoodId
- summary
- model
- expiresAt
- createdAt
- updatedAt

## analyticsEvents

Fields:

- id
- userId nullable
- guestSessionId nullable
- eventName
- eventPayload JSON
- createdAt

---

# Seed Data

Create a seed script that inserts the following 10 Calgary neighborhoods.

Scores use this scale:

```text
1 = Very Low
2 = Low
3 = Medium
4 = High
5 = Very High
```

## Beltline

```text
City: Calgary
Affordability: 3
Walkability: 5
Transit: 5
Nightlife: 5
Safety: 3
Fitness: 4
Pet-friendliness: 3
Identity: Urban nightlife hub and downtown professional corridor
Population density class: urban
Lifestyle tags: nightlife, downtown, transit, restaurants, young professionals
```

## Kensington

```text
City: Calgary
Affordability: 3
Walkability: 5
Transit: 3
Nightlife: 3
Safety: 4
Fitness: 3
Pet-friendliness: 5
Identity: Walkable café culture and community-oriented social lifestyle
Population density class: urban
Lifestyle tags: cafes, walkable, community, pets, river access
```

## Mission

```text
City: Calgary
Affordability: 3
Walkability: 5
Transit: 4
Nightlife: 5
Safety: 3
Fitness: 3
Pet-friendliness: 3
Identity: Trendy entertainment district with strong restaurant and bar scene
Population density class: urban
Lifestyle tags: nightlife, restaurants, walkable, social, inner-city
```

## Inglewood

```text
City: Calgary
Affordability: 4
Walkability: 4
Transit: 3
Nightlife: 3
Safety: 4
Fitness: 3
Pet-friendliness: 4
Identity: Arts and culture community; independent retail and creative industries
Population density class: mixed
Lifestyle tags: arts, culture, local shops, creative, character
```

## Bridgeland

```text
City: Calgary
Affordability: 3
Walkability: 4
Transit: 3
Nightlife: 3
Safety: 4
Fitness: 4
Pet-friendliness: 5
Identity: Balanced urban-residential blend; strong community identity and pet culture
Population density class: mixed
Lifestyle tags: community, pets, cafes, parks, urban-residential
```

## East Village

```text
City: Calgary
Affordability: 3
Walkability: 5
Transit: 5
Nightlife: 4
Safety: 3
Fitness: 4
Pet-friendliness: 3
Identity: Modern downtown redevelopment with riverfront access
Population density class: urban
Lifestyle tags: downtown, riverfront, modern, transit, walkable
```

## Marda Loop

```text
City: Calgary
Affordability: 3
Walkability: 4
Transit: 3
Nightlife: 3
Safety: 4
Fitness: 5
Pet-friendliness: 4
Identity: Young professional hub with dominant fitness and wellness culture
Population density class: mixed
Lifestyle tags: fitness, wellness, young professionals, restaurants, lifestyle
```

## Sunnyside

```text
City: Calgary
Affordability: 3
Walkability: 4
Transit: 4
Nightlife: 2
Safety: 4
Fitness: 3
Pet-friendliness: 5
Identity: Transit-friendly urban living with relaxed community atmosphere
Population density class: urban
Lifestyle tags: transit, relaxed, pets, river access, community
```

## University District

```text
City: Calgary
Affordability: 4
Walkability: 5
Transit: 4
Nightlife: 3
Safety: 4
Fitness: 4
Pet-friendliness: 3
Identity: Purpose-built mixed-use development for students and young professionals
Population density class: mixed
Lifestyle tags: students, mixed-use, modern, walkable, university
```

## Seton

```text
City: Calgary
Affordability: 5
Walkability: 3
Transit: 3
Nightlife: 2
Safety: 4
Fitness: 3
Pet-friendliness: 4
Identity: Affordable suburban growth corridor in Calgary's southeast
Population density class: suburban
Lifestyle tags: affordable, suburban, southeast, families, growth
```

Use reasonable placeholder values for:

- `medianRentalEstimate`
- `downtownCommuteEstimateMins`
- `description`
- `lastReviewedDate`
- score note fields

Make all placeholder values editable in the admin dashboard.

The seed script must be idempotent. It should be safe to re-run without duplicating records.

---

# Scoring Engine

Implement the exact formula:

```text
Compatibility Score (%) =
[ Σ (neighborhood_score_i × user_weight_i) / (5 × Σ user_weight_i) ] × 100
```

Where:

- `neighborhood_score_i` is the neighborhood's 1–5 score for a dimension.
- `user_weight_i` is the user's normalized priority weight.
- User weights sum to 100 after normalization.
- Dividing by 5 maps the highest possible weighted score to 100%.

## Required scoring behavior

- Return the top 5 neighborhoods.
- Exclude neighborhoods below 30% compatibility.
- Include per-dimension contribution breakdown.
- Include tradeoff explanations.
- Include affordability warning if user budget is below the neighborhood's estimated rent.
- Rankings must be deterministic.
- Identical inputs must return identical rankings.
- The frontend must display the exact reasons behind each result.

## Required test case

User weights:

```text
Walkability: 35
Transit: 25
Nightlife: 20
Affordability: 20
```

Beltline scores:

```text
Walkability: 5
Transit: 5
Nightlife: 5
Affordability: 3
```

Expected score:

```text
[(5×35) + (5×25) + (5×20) + (3×20)] / (5×100) × 100
= 92%
```

This test must pass.

---

# Default Weights

Use these default weights when optional questions are skipped or when the user does not provide enough priority data:

```text
Affordability: 20
Walkability: 20
Transit: 15
Safety: 15
Fitness: 10
Nightlife: 10
Pet-friendliness: 10
```

Whenever defaults are applied, show this message:

```text
Your results use default weights for skipped questions. Complete all questions for a more personalized result.
```

This disclosure must appear on the results page and in the score breakdown.

---

# AI Summary Generation

Use AI only to generate human-readable summaries based on structured scores and user priorities.

Do not use AI to generate the final numeric scores.

## Model

Use:

```text
gpt-4o-mini
```

## Summary requirements

Each AI summary should:

- Be under 120 words
- Start with the strongest fit reason
- Explain strengths and tradeoffs
- Avoid absolute claims
- Avoid financial, legal, or real estate advice
- Be based only on provided structured data
- Include a subtle informational disclaimer when appropriate

## Prompt template

Use a prompt like:

```text
Generate a concise neighborhood lifestyle summary for {neighborhoodName}, Calgary, for a user prioritizing {topPriorities}. Neighborhood scores: {scores}. Explain strengths and tradeoffs in under 120 words. Begin with the strongest fit reason. Do not provide financial, legal, or real estate advice. Base the summary only on the provided structured data.
```

---

# AI Summary Cache

Implement database-backed cache.

## Cache key format

```text
neighborhood_id + top_3_priority_dimensions_sorted_alphabetically + weight_bucket
```

Example:

```text
beltline_nightlife-transit-walkability_30-20-30
```

## Cache rules

- TTL: 24 hours
- Round relevant weights to nearest 10%
- If cache entry exists and is not expired, use it
- If OpenAI fails, use expired cache as fallback if available
- If no fallback exists, show the numeric recommendation and a graceful AI summary error state
- Admin updates to neighborhood data must invalidate relevant cache entries

---

# Authentication

Implement database-backed authentication.

## Guest users

Guests can:

- Complete full questionnaire
- Receive top 5 recommendations
- View AI summaries
- Use comparison tool

Guest data rules:

- Store guest data in server-side ephemeral sessions
- TTL: 2 hours
- Do not permanently store guest personal data
- Do not require registration before results

After results, show:

```text
Create a free account to save your results and compare later.
```

## Registered users

Registered users can:

- Complete questionnaire
- View recommendations
- Save favorite neighborhoods
- View recommendation history
- Revisit results across sessions

Rules:

- Sessions expire after 7 days of inactivity
- Passwords are bcrypt-hashed
- Duplicate emails are prevented
- Invalid credentials show clear but secure errors

## Admin users

Admins can:

- Edit neighborhood scores
- Edit score notes/evidence fields
- Edit descriptions
- Edit rent estimates
- Edit commute estimates
- Edit lifestyle tags
- Invalidate AI summary cache
- View basic analytics

Rules:

- Admin role cannot be self-assigned
- Seed admin user from environment variables
- Protect admin routes on frontend and backend
- Normal users must not see or access admin features

---

# API Endpoints

Implement REST endpoints.

## Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

## Recommendations

```text
POST /api/recommendations
GET /api/recommendations/history
GET /api/recommendations/:id
```

## Neighborhoods

```text
GET /api/neighborhoods
GET /api/neighborhoods/:slug
```

## Favorites

```text
GET /api/favorites
POST /api/favorites/:neighborhoodId
DELETE /api/favorites/:neighborhoodId
```

## Comparison

```text
POST /api/compare
```

## Admin

```text
GET /api/admin/neighborhoods
PATCH /api/admin/neighborhoods/:id
POST /api/admin/neighborhoods/:id/invalidate-cache
GET /api/admin/analytics
```

Validate all request bodies with Zod or equivalent.

---

# UI Pages

Build these pages.

## Public pages

```text
/
 /questionnaire
 /results
 /compare
 /neighborhoods
 /neighborhoods/:slug
 /login
 /register
```

## Authenticated pages

```text
/dashboard
/favorites
/history
/settings
```

## Admin pages

```text
/admin
/admin/neighborhoods
/admin/analytics
```

---

# Homepage Requirements

Create a polished landing page with:

- Hero section
- CTA: `Start matching`
- Value proposition: `Find the Calgary neighborhood that fits how you actually live.`
- Brief explanation of the app
- Four-step flow:
  1. Answer lifestyle questions
  2. Get your top Calgary matches
  3. Compare tradeoffs
  4. Save your shortlist
- Privacy note
- Informational disclaimer

The homepage should feel like a modern SaaS product.

---

# Questionnaire Requirements

Build a multi-step questionnaire.

Collect:

## Required

- Monthly housing budget
- Affordability priority
- Walkability priority
- Transit priority
- Nightlife / social priority
- Safety priority
- Fitness / wellness priority

## Optional

- Pet-friendliness priority
- Family situation
- Workplace or school location as a Calgary neighborhood dropdown

Do not collect exact addresses.

Use:

- Sliders
- Visual cards
- Progress indicators
- Mobile-first form layout
- Clear validation
- Friendly copy

---

# Results Dashboard Requirements

The results page must show:

- Top 5 neighborhood cards
- Compatibility percentage
- Fit label
- AI summary
- Affordability indicator
- Downtown commute estimate
- Required commute disclaimer
- Visual score breakdown across all 7 dimensions
- Per-dimension contribution breakdown
- Tradeoff explanation
- Save button for registered users
- Registration CTA for guests
- Sort controls:
  - Compatibility
  - Affordability
  - Commute time

## Compatibility labels

```text
85–100: Excellent fit
70–84: Strong fit
50–69: Moderate fit
30–49: Weak but possible fit
Below 30: excluded
```

---

# Required Commute Disclaimer

Every commute estimate must show this exact text:

```text
Commute estimate assumes a downtown Calgary destination. For other workplaces, use Google Maps.
```

Do not show commute numbers without this disclaimer.

---

# Comparison Tool

Allow users to compare 2–3 neighborhoods.

Show:

- Side-by-side cards
- All 7 score categories
- Visual bars or radar chart
- Rent estimate
- Downtown commute estimate
- Required commute disclaimer
- Lifestyle tags
- Strengths
- Tradeoffs

The comparison page should look demo-ready and presentation-quality.

---

# Favorites and History

Registered users can:

- Save neighborhoods
- Remove saved neighborhoods
- View saved neighborhoods
- View past recommendation sessions
- Reopen previous result sets

Guests who try to save should be prompted to register or log in.

---

# Admin Dashboard

Build a clean admin dashboard.

Features:

- List all neighborhoods
- Edit neighborhood form/modal
- Update all 1–5 scores
- Update score notes/evidence fields
- Update identity and description
- Update rent estimate
- Update commute estimate
- Update population density class
- Update tags
- Save changes
- Invalidate AI cache for a neighborhood
- View simple analytics

Admin analytics:

- Questionnaire starts
- Questionnaire completions
- Recommendation sessions
- Favorite saves
- Registered users
- Guest sessions
- Admin neighborhood updates

---

# Analytics Events

Track:

```text
questionnaire_started
questionnaire_completed
recommendations_generated
neighborhood_saved
comparison_started
registration_completed
login_completed
admin_neighborhood_updated
ai_summary_generated
ai_summary_cache_hit
ai_summary_cache_miss
```

Analytics can be simple database inserts. Do not add third-party analytics.

---

# Security Requirements

Implement:

- Bcrypt password hashing
- Secure sessions
- Server-side environment variables
- Input validation
- Output sanitization
- XSS prevention
- Rate limiting on auth endpoints
- Rate limiting on AI endpoints
- Admin middleware
- No API keys in frontend
- No exact addresses collected
- Graceful error handling
- No internal stack traces shown to users

---

# Privacy Requirements

Add a visible prototype privacy note in the footer or settings page:

```text
This classroom prototype is hosted on Replit and should not be used to collect sensitive personal data. A public production deployment would require Canadian-resident infrastructure and a PIPEDA/PIPA-compliant privacy policy.
```

The app should not pretend to be production-compliant.

---

# Accessibility Requirements

Target WCAG 2.1 AA basics:

- Semantic HTML
- Keyboard navigation
- Accessible form labels
- Focus states
- Clear error messages
- Sufficient contrast
- Screen-reader friendly controls
- No color-only meaning
- Buttons must have accessible names

---

# Error Handling

Handle:

- OpenAI API unavailable
- Database errors
- Invalid questionnaire submission
- Guest session expiry
- No neighborhoods above 30% compatibility
- Unauthenticated favorite save attempt
- Unauthorized admin access
- Duplicate registration email
- Invalid login credentials
- Expired AI cache
- Missing environment variables

The UI should never crash.

---

# Testing Requirements

Add tests or testable scripts for:

## Scoring engine

Must verify:

- Beltline example returns 92%
- Weights normalize correctly
- Default weights are applied correctly
- Neighborhoods below 30% are excluded
- Results are deterministic

## API

Test manually or automatically:

- Register
- Login
- Generate recommendations
- Save favorite
- Get history
- Admin update neighborhood
- Invalidate cache

## UI acceptance checks

Verify:

- Guest can complete questionnaire without registering
- Results show top 5 neighborhoods
- AI summaries display or fail gracefully
- Default weight disclosure appears when defaults are used
- Commute disclaimer appears everywhere commute is shown
- Registered user can save favorites
- Admin dashboard is protected
- Mobile layout works

---

# Design Direction

Make the app feel like a real startup MVP.

Use:

- Clean modern SaaS layout
- Soft cards
- Strong spacing
- Rounded corners
- Subtle gradients
- Professional typography
- Responsive grids
- Clear CTAs
- Friendly empty states
- Skeleton loaders
- Simple but polished charts

Avoid:

- Plain unstyled forms
- Developer-looking UI
- Overcrowded dashboards
- Fake non-functional buttons
- Hardcoded scores in frontend
- AI-generated numeric scoring
- MLS or mapping integrations

---

# Non-Goals

Do not build:

- MLS integrations
- Realtor.ca integrations
- Zillow integrations
- Google Maps API
- Calgary Transit API
- Real-time rental inventory
- Mortgage calculators
- Payment subscriptions
- Native mobile app
- Multi-city support beyond schema readiness
- AI-generated numeric neighborhood scores

---

# Production-Readiness Notes

In the README, document that:

- This is a classroom prototype.
- Replit hosting may route data outside Canada.
- A public launch would require Canadian-resident infrastructure.
- Privacy policy and PIPEDA/PIPA review are required before real-user deployment.
- The current scores are curated MVP assumptions.
- Admin review is required before publishing score changes.
- Future APIs should support score evidence, not automatically decide final scores.

---

# README Requirements

Create a README with:

- Project overview
- Tech stack
- Folder structure
- Environment variables
- Database setup
- Seed instructions
- How to run on Replit
- How to create admin user
- How scoring works
- Why AI does not generate the numeric scores
- How AI summaries work
- Known limitations
- Future roadmap
- Production migration notes

---

# Definition of Done

The app is complete when:

- A guest can complete the questionnaire and receive top 5 results.
- A registered user can save favorites.
- A registered user can view recommendation history.
- Admin can edit neighborhood data.
- Admin can invalidate AI cache.
- AI summaries generate or fallback gracefully.
- Compatibility scores follow the exact formula.
- Beltline scoring test returns 92%.
- Commute disclaimer appears on all commute displays.
- Default weight disclosure appears when needed.
- Neighborhood scores are stored in the database, not hardcoded in React.
- AI does not generate final numeric ratings.
- No Supabase code exists.
- No API keys are exposed to the frontend.
- App runs successfully on Replit.
- UI is mobile responsive and demo-ready.

Build the MVP now.
