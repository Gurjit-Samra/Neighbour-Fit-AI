# NeighbourFit AI — AI insight implementation instructions

## Purpose

The AI insight feature generates a short lifestyle-focused paragraph for each neighbourhood result card.

This insight should help users understand what living in a neighbourhood might actually feel like based on their lifestyle priorities, the neighbourhood dataset, and the app’s matching logic.

The AI insight should **not** replace the scoring engine. The recommendation score must remain deterministic and based on structured data. The AI insight is only an explanation and lifestyle storytelling layer.

---

## Core principle

NeighbourFit AI uses a hybrid approach:

```text
Structured neighbourhood data = source of truth
Deterministic scoring engine = recommendation logic
AI insight = lifestyle explanation layer
```

The AI should enrich the user experience, but it should not invent the underlying match score or make final decisions about neighbourhood ranking.

---

## What the AI insight should do

Each AI insight should:

- Explain why the neighbourhood fits the user’s lifestyle priorities
- Describe the neighbourhood in a warm, human, lifestyle-oriented way
- Mention realistic routines, activities, or local experiences
- Highlight one practical tradeoff or caution
- Use structured neighbourhood data first
- Use the AI model’s general Calgary knowledge only as supporting context
- Avoid repeating information already shown elsewhere on the card

---

## What the AI insight should not do

The AI insight should not:

- Mention compatibility percentages
- Mention numeric scores
- Mention MVP scores
- Mention recommendation tiers
- Repeat every card metric
- Give financial, legal, safety, immigration, or real estate advice
- Overpromise safety, affordability, commute reliability, social life, or belonging
- Use stigmatizing language about crime, demographics, religion, culture, newcomers, or income
- Invent specific businesses, venues, schools, churches, mosques, temples, gurdwaras, parks, or landmarks unless they are provided in the dataset or are widely known
- Sound like a real estate listing
- Sound like a tourism brochure
- Sound like generic AI output

---

## Recommended UI label

Use this label for the AI result box:

```text
Lifestyle insight
```

Alternative labels:

```text
Neighbourhood vibe
Why it fits your lifestyle
Living here might feel like
Local lifestyle read
```

Recommended choice:

```text
Lifestyle insight
```

---

## Data source strategy

The AI insight should use two sources of context:

1. Structured app data from the neighbourhood database
2. The AI model’s general knowledge of Calgary neighbourhoods and lifestyle patterns

The structured app data should always take priority.

If the structured data conflicts with the model’s general knowledge, the AI should follow the structured app data.

---

## Recommended backend data object

Do not send the entire raw database row directly to the AI.

Instead, transform the neighbourhood row into a cleaner AI context object.

Example:

```json
{
  "neighbourhood": "Kensington",
  "zoneQuadrant": "NW / Inner City",
  "lifestyleIdentity": "Walkable café culture and community-oriented social lifestyle",
  "communityVibe": "Social, walkable, relaxed, urban village feel",
  "bestFor": "Young professionals, students, remote workers, café lifestyle, pet owners",
  "primaryDemographic": "Young professionals, students, renters, established residents",
  "closestMajorArea": "Downtown Calgary, Sunnyside, SAIT, University of Calgary",
  "suburbanOrCityLike": "City-like",
  "urbanForm": "Inner-city mixed-use",
  "density": "Medium-high",
  "primaryMatchingDrivers": [
    "Walkability",
    "Coffee shop access",
    "Transit access",
    "Community atmosphere"
  ],
  "keyTradeoffs": [
    "Parking can be limited",
    "Rent may be higher than suburban options",
    "Busier on weekends"
  ],
  "accessContext": {
    "downtownAccess": "Strong",
    "universityAccess": "Strong",
    "airportAccess": "Moderate",
    "healthcareAccess": "Moderate",
    "transitType": "CTrain and bus",
    "carDependencyLevel": "Low to moderate"
  },
  "lifestyleContext": {
    "walkability": "High",
    "winterWalkability": "Moderate",
    "groceryStoreAccess": "Good",
    "coffeeShopDensity": "High",
    "fitnessAndWellness": "Moderate",
    "parksGreenSpace": "Good",
    "nightlifeSocial": "Moderate",
    "studentFriendly": "High",
    "familyFriendly": "Moderate",
    "noiseLevel": "Moderate",
    "parkingAvailability": "Limited"
  },
  "culturalCommunityContext": {
    "diversityLevel": "Moderate",
    "newcomersSupportAccess": "Moderate",
    "religiousCulturalAccess": "Moderate",
    "churchAccess": "Moderate",
    "mosqueAccess": "Limited",
    "templeGurdwaraAccess": "Limited",
    "culturalGroceryAccess": "Moderate"
  },
  "userContext": {
    "topPriorities": [
      "Walkability",
      "Transit access",
      "Coffee shops",
      "Social lifestyle"
    ],
    "budgetRange": "Moderate",
    "householdType": "Single professional",
    "commutePreference": "Prefers transit or walking"
  }
}
```

---

## Dataset columns to use for AI insight

The app may contain many neighbourhood columns, but only selected fields should be passed into the AI prompt.

### High-value AI insight columns

Use these fields when available:

```text
Zone/Quadrant
Neighbourhood
Airport access
Healthcare access
Closest major area
University access
Downtown access
Car dependency level
Newcomers support access
Primary demographic
Walkability
Transit access
Safety perception
Nightlife/social
Family friendly
Parks/green space
Diversity level
Religious/cultural access
Church access
Mosque access
Temple/Gurdwara access
Cultural grocery access
Community vibe
Best for
Affordability Band
Winter Walkability
Transit Type
Noise Level
Parking Availability
Grocery Store Access
Coffee Shop Density
Fitness & Wellness
Student Friendly
Community Center
Suburban or City-Like
Key Tradeoffs
Primary Matching Drivers
Urban Form
Density
Lifestyle identity
```

---

## Fields to avoid emphasizing in AI card copy

These fields can exist in the database but should not be heavily surfaced in AI-generated lifestyle text:

```text
Crime rate category
MVP Score
Recommendation Tier
Data Confidence
Needs Validation
Main Risk Category
Average Mortgage Payment
Avg Home Price
```

### Notes

- `Crime rate category` should be handled carefully to avoid stigmatizing language.
- `Data Confidence` and `Needs Validation` are internal data-quality fields.
- `MVP Score` and `Recommendation Tier` are internal product fields.
- Mortgage and home price data should not be framed as financial advice.

---

## AI prompt template

Use this prompt when generating the lifestyle insight for each neighbourhood card.

```text
You are the lifestyle insight writer for NeighbourFit AI, a Calgary neighbourhood matching platform.

Write a creative, specific, lifestyle-focused insight for the neighbourhood card shown to the user.

Use two sources of context:
1. The structured neighbourhood data provided below.
2. Your own general knowledge of Calgary neighbourhoods, local lifestyle patterns, geography, amenities, and common neighbourhood character.

The insight should feel like a local friend explaining what living in this neighbourhood might actually feel like. Do not sound like a real estate listing, tourism brochure, or generic AI summary.

Neighbourhood:
{{Neighbourhood}}

Zone / quadrant:
{{Zone/Quadrant}}

Lifestyle identity:
{{Lifestyle identity}}

Community vibe:
{{Community vibe}}

Best for:
{{Best for}}

Primary demographic:
{{Primary demographic}}

Closest major area:
{{Closest major area}}

Suburban or city-like:
{{Suburban or City-Like}}

Urban form:
{{Urban Form}}

Density:
{{Density}}

User’s strongest lifestyle priorities:
{{topPriorities}}

Primary matching drivers:
{{Primary Matching Drivers}}

Key tradeoffs:
{{Key Tradeoffs}}

Access context:
- Downtown access: {{Downtown access}}
- University access: {{University access}}
- Airport access: {{Airport access}}
- Healthcare access: {{Healthcare access}}
- Transit type: {{Transit Type}}
- Car dependency level: {{Car dependency level}}

Lifestyle context:
- Walkability: {{Walkability}}
- Winter walkability: {{Winter Walkability}}
- Grocery store access: {{Grocery Store Access}}
- Coffee shop density: {{Coffee Shop Density}}
- Fitness and wellness: {{Fitness & Wellness}}
- Parks / green space: {{Parks/green space}}
- Nightlife / social: {{Nightlife/social}}
- Student friendly: {{Student Friendly}}
- Family friendly: {{Family friendly}}
- Noise level: {{Noise Level}}
- Parking availability: {{Parking Availability}}

Cultural and community access:
- Diversity level: {{Diversity level}}
- Newcomers support access: {{Newcomers support access}}
- Religious / cultural access: {{Religious/cultural access}}
- Church access: {{Church access}}
- Mosque access: {{Mosque access}}
- Temple / Gurdwara access: {{Temple/Gurdwara access}}
- Cultural grocery access: {{Cultural grocery access}}

User context:
{{userContext}}

Instructions:
Write one polished paragraph between 90 and 130 words.

Start with the strongest lifestyle reason this neighbourhood could fit the user.

Include:
1. A vivid snapshot of daily life in the neighbourhood.
2. One or two realistic activity ideas, routines, or local experiences the user might enjoy.
3. A natural explanation of why this area fits the user’s stated priorities.
4. One practical tradeoff or caution based on the provided data.

Important grounding rules:
- Prioritize the structured neighbourhood data when it conflicts with your general Calgary knowledge.
- Use your own Calgary knowledge only to enrich the response with realistic local context.
- Do not invent exact businesses, restaurants, venues, parks, schools, churches, mosques, temples, gurdwaras, or landmarks unless they are provided in the data or are widely known.
- If you are not confident about a specific place, describe the type of place instead.
- Do not mention compatibility scores, MVP scores, recommendation tiers, numeric ratings, or internal scoring.
- Do not mention data confidence or needs validation.
- Do not use alarming or stigmatizing language about crime, demographics, religion, culture, income, newcomers, or family status.
- Do not imply that a neighbourhood is only for one type of person.
- Do not give financial, legal, safety, immigration, or real estate advice.
- Do not overpromise safety, affordability, commute reliability, social life, belonging, or quality of life.
- Avoid clichés like “hidden gem,” “something for everyone,” “perfect fit,” and “vibrant community.”
- Keep the tone warm, modern, specific, honest, lifestyle-oriented, and slightly aspirational.
- End with a practical tradeoff sentence.

Output only the paragraph. No heading. No bullet points.
```

---

## Example output style

The AI insight should sound like this:

```text
Kensington fits best if you want your daily routine to feel walkable, social, and easy to personalize. It is the kind of neighbourhood where grabbing coffee, walking along nearby pathways, meeting a friend for food, or hopping on transit can feel like part of the same afternoon instead of separate errands. For someone prioritizing walkability and a social but not overwhelming atmosphere, the area offers a strong mix of inner-city convenience and neighbourhood character. The main tradeoff is that parking and rent can feel tighter than in more suburban areas, so it works best if you are comfortable paying for access and relying less on a car.
```

---

## Backend implementation notes

### Recommended flow

```text
1. User completes questionnaire.
2. Backend calculates deterministic recommendation scores.
3. Backend selects top neighbourhood results.
4. Backend builds a cleaned AI context object for each result.
5. Backend checks AI insight cache.
6. If cache hit exists, return cached insight.
7. If no cache exists, call OpenAI.
8. Store generated insight in cache.
9. Return result cards with score data plus AI insight.
```

---

## AI cache strategy

Cache AI insights to reduce cost and improve speed.

Recommended cache key:

```text
neighbourhoodId + topUserPriorities + lifestyleIdentity + keyTradeoffVersion
```

Example:

```text
kensington_walkability-transit-social_v1
```

Recommended TTL:

```text
24 hours
```

Invalidate cache when:

- Neighbourhood lifestyle identity changes
- Community vibe changes
- Key tradeoffs change
- Primary matching drivers change
- Admin updates major lifestyle fields
- Prompt version changes

---

## Suggested database table

```text
ai_insight_cache
```

Suggested fields:

```text
id
cache_key
neighbourhood_id
prompt_version
model
input_context_hash
insight_text
expires_at
created_at
updated_at
```

---

## Prompt versioning

Store a prompt version string in the backend.

Example:

```text
AI_INSIGHT_PROMPT_VERSION = "lifestyle-insight-v1"
```

When the prompt changes, update the version so old cached responses do not keep appearing.

---

## Model settings

Recommended OpenAI settings:

```text
model: gpt-4o-mini
temperature: 0.75
max_tokens: 220
```

Rationale:

- `gpt-4o-mini` is cost-effective for short card insights.
- `temperature: 0.75` gives the copy some creative lifestyle energy without becoming too chaotic.
- `max_tokens: 220` is enough for a 90–130 word paragraph.

---

## Fallback behaviour

If the AI call fails:

1. Use a cached insight if available.
2. If no cached insight exists, show a non-AI fallback generated from structured data.

Fallback example:

```text
This neighbourhood appears to fit your lifestyle priorities based on its strongest matching drivers, including {{Primary Matching Drivers}}. It may be especially relevant if you are looking for {{Best for}} and prefer a {{Suburban or City-Like}} environment. The main tradeoff to consider is {{Key Tradeoffs}}.
```

Do not block the recommendation card from rendering just because the AI insight fails.

---

## Safety and quality rules

The AI insight must stay respectful and non-stigmatizing.

Special care is required when using columns related to:

```text
Crime rate category
Primary demographic
Diversity level
Religious/cultural access
Newcomers support access
Affordability
Safety perception
```

Use neutral wording.

Avoid phrases like:

```text
dangerous area
bad neighbourhood
unsafe people
low-class
ethnic area
immigrant area
poor area
not family-safe
```

Use safer wording like:

```text
Some users may want to compare this area carefully against their comfort level and daily routine.
```

or:

```text
The main tradeoff is that this area may require more personal research depending on your comfort with noise, commute style, and evening activity.
```

---

## Final implementation standard

The AI insight is successful when it:

- Feels local and lifestyle-driven
- Uses the user’s priorities
- Uses structured neighbourhood data
- Adds helpful context beyond the visible scorecard
- Avoids repeating numeric score information
- Includes one honest tradeoff
- Does not hallucinate unsupported specific locations
- Does not make risky claims
- Makes the result card feel more personal and memorable
