# NeighbourFit AI - Lifestyle Questionnaire Documentation

## Overview

The NeighbourFit Lifestyle Questionnaire is an 8-step progressive disclosure form that captures user preferences for neighborhood matching in Calgary. This feature serves as the primary data entry point for the platform and is designed to maximize completion rates (target: >75%).

## Architecture

### Component Structure

```
questionnaire-wizard.tsx (Main orchestrator)
├── steps/
│   ├── budget-step.tsx
│   ├── walkability-step.tsx
│   ├── transit-step.tsx
│   ├── nightlife-step.tsx
│   ├── safety-step.tsx
│   ├── fitness-step.tsx
│   ├── pet-step.tsx
│   └── workplace-step.tsx
└── results-view.tsx
```

### Data Flow

1. **User Input** → Each step updates shared state via `updateData()` callback
2. **State Management** → React `useState` maintains all responses in `QuestionnaireData` object
3. **Validation** → Per-step validation before navigation
4. **Normalization** → Weights normalized to sum to 100% before submission
5. **API Call** → POST to `/api/recommendations` with normalized payload
6. **Results Display** → Mock neighborhood recommendations shown

## Question Logic

### Step 1: Budget (Required)

- **Input Type**: Numeric slider (500-5000 CAD) + direct input
- **Validation**: Must be > 0
- **Special Logic**: 
  - Shows affordability warning if budget < 70% of Calgary median ($1,800)
  - Displays reference pricing for shared room, 1BR, 2BR

**Implementation**: `/src/app/components/steps/budget-step.tsx`

### Step 2: Walkability (Required)

- **Input Type**: 1-100 slider
- **Label**: "How important is it to run errands on foot?"
- **Context**: Examples of high walkability vs car-dependent neighborhoods

**Implementation**: `/src/app/components/steps/walkability-step.tsx`

### Step 3: Transit (Required)

- **Input Type**: 1-100 slider
- **Label**: "How much do you rely on C-Train or bus access?"
- **Context**: Red Line and Blue Line access examples

**Implementation**: `/src/app/components/steps/transit-step.tsx`

### Step 4: Nightlife & Social (Required)

- **Input Type**: 1-100 slider + Multi-select vibe cards
- **Vibe Options**:
  - Trendy Restaurants
  - Quiet Pubs
  - Live Music
  - Social Hubs
- **Data Captured**: 
  - `nightlife` (number): Weight score
  - `nightlifeVibe` (string[]): Selected vibe preferences

**Implementation**: `/src/app/components/steps/nightlife-step.tsx`

### Step 5: Safety (Required)

- **Input Type**: 1-100 slider
- **Label**: "Priority for well-lit streets and low crime rates"
- **Context**: Information about neighborhood watch programs

**Implementation**: `/src/app/components/steps/safety-step.tsx`

### Step 6: Fitness & Wellness (Required)

- **Input Type**: 1-100 slider
- **Label**: "Proximity to gyms, yoga studios, or the River Pathway system"
- **Context**: Examples of fitness centers and Bow/Elbow River pathway access

**Implementation**: `/src/app/components/steps/fitness-step.tsx`

### Step 7: Pet-Friendliness (Optional)

- **Input Type**: Toggle + Conditional 1-100 slider
- **Flow**:
  1. Toggle: "Do you have a pet?"
  2. If YES → Show slider for importance weight
  3. If NO → Skip, use default weight (10%) in normalization

**Implementation**: `/src/app/components/steps/pet-step.tsx`

### Step 8: Workplace/School (Required)

- **Input Type**: Dropdown selector
- **Options**: 
  - Downtown Core
  - Beltline
  - University of Calgary
  - SAIT
  - Southeast/Northeast Industrial
  - Work From Home
  - Other/Multiple Locations
- **Privacy**: Only general area collected, not precise addresses
- **Special Logic**: Shows WFH-specific message if "Work From Home" selected

**Implementation**: `/src/app/components/steps/workplace-step.tsx`

## Weight Normalization

### The Rule of 100

All user-defined weights MUST sum to exactly 100% before submission to the scoring engine.

### Algorithm

```typescript
function normalizeWeights() {
  // 1. Collect all weights
  const weights = {
    affordability: 20, // Fixed at 20%
    walkability: data.walkability,
    transit: data.transit,
    nightlife: data.nightlife,
    safety: data.safety,
    fitness: data.fitness,
    petFriendliness: data.hasPet ? data.petFriendliness : 0,
  };

  // 2. Calculate total (excluding fixed affordability)
  const userWeightsTotal = 
    weights.walkability + 
    weights.transit + 
    weights.nightlife + 
    weights.safety + 
    weights.fitness + 
    (data.hasPet ? weights.petFriendliness : 0);

  // 3. Normalize to ensure total = 100
  const targetTotal = 80; // 100 - 20 (affordability)
  const scaleFactor = targetTotal / userWeightsTotal;

  return {
    affordability: 20,
    walkability: Math.round(weights.walkability * scaleFactor),
    transit: Math.round(weights.transit * scaleFactor),
    nightlife: Math.round(weights.nightlife * scaleFactor),
    safety: Math.round(weights.safety * scaleFactor),
    fitness: Math.round(weights.fitness * scaleFactor),
    petFriendliness: data.hasPet ? Math.round(weights.petFriendliness * scaleFactor) : 0,
  };
}
```

### Default Weights

If user skips optional questions or leaves all sliders at default (50):

```typescript
const DEFAULT_WEIGHTS = {
  affordability: 20,
  walkability: 20,
  transit: 15,
  safety: 15,
  fitness: 10,
  nightlife: 10,
  petFriendliness: 10,
};
```

**Transparency Requirement**: If defaults are applied, show warning:
> "Your results use default weights for skipped questions. Complete all questions for a more personalized result."

## API Integration

### Endpoint

```
POST /api/recommendations
```

### Request Payload

```typescript
interface RecommendationPayload {
  weights: {
    affordability: number;    // Always 20
    walkability: number;      // 1-100, normalized
    transit: number;          // 1-100, normalized
    nightlife: number;        // 1-100, normalized
    safety: number;           // 1-100, normalized
    fitness: number;          // 1-100, normalized
    petFriendliness?: number; // 0 or 1-100, normalized
  };
  context: {
    budget: number;           // Monthly CAD
    workplace: string;        // Selected neighborhood
    nightlifeVibe?: string[]; // Selected vibe preferences
  };
}
```

### Example

```json
{
  "weights": {
    "affordability": 20,
    "walkability": 25,
    "transit": 20,
    "nightlife": 15,
    "safety": 10,
    "fitness": 10,
    "petFriendliness": 0
  },
  "context": {
    "budget": 2000,
    "workplace": "downtown",
    "nightlifeVibe": ["trendy", "live-music"]
  }
}
```

### Response

```typescript
interface NeighborhoodRecommendation {
  name: string;
  score: number;              // Match percentage (0-100)
  estimatedRent: {
    min: number;
    max: number;
  };
  commuteTime: string;
  highlights: string[];
  amenities?: {
    walkScore: number;
    transitScore: number;
    bikeScore: number;
  };
}
```

## UI/UX Features

### Progressive Disclosure

- **One question per screen** to avoid overwhelm
- **Progress bar** showing completion percentage
- **Step indicator**: "Step X of 8: [Category]"

### Navigation

- **Back button**: Allows editing previous answers without losing data
- **Next button**: Validates current step before proceeding
- **Final step**: "Get Recommendations" CTA

### Animations

- **Slide transitions**: Using Motion (Framer Motion) for smooth step changes
- **Fade in/out**: Question content animates between steps
- **Duration**: 300ms for optimal perceived performance

### Mobile Optimization

- **Touch-friendly sliders**: Large hit areas for mobile
- **Responsive cards**: Stack vertically on mobile, grid on desktop
- **Safe area handling**: Proper padding for mobile browsers

### Visual Feedback

- **Real-time value display**: Circular badge showing current slider value
- **Color coding**: Each category has distinct color (walkability=orange, transit=blue, etc.)
- **Toast notifications**: Success/error messages using Sonner
- **Loading states**: Simulated API delay with loading indicator

## Session Handling

For unauthenticated users:

- **Storage**: Express in-memory session
- **TTL**: 2 hours
- **Fallback**: Can restart questionnaire anytime with "Start Over" button

## Success Criteria

### Completion Rate Target: >75%

**Measured by**: `(users_completing_step_8 / users_starting_step_1) * 100`

### Strategies to Maximize Completion

1. **Short time to insight**: 8 steps feels achievable
2. **Visual progress**: Progress bar shows advancement
3. **No dead ends**: Can always go back and edit
4. **Smart defaults**: 50/100 on all sliders to reduce decision fatigue
5. **Contextual help**: Examples and explanations for each category
6. **Mobile-first**: Optimized for smartphone users (primary device)

## Testing Checklist

- [ ] All required fields validated
- [ ] Optional pet question skippable
- [ ] Weight normalization sums to 100%
- [ ] Affordability warning triggers correctly (< $1,260)
- [ ] Back button preserves data
- [ ] Mobile responsive (iOS Safari, Android Chrome)
- [ ] Transitions smooth at 60fps
- [ ] API payload matches specification
- [ ] Toast notifications appear for errors
- [ ] Results page renders with mock data
- [ ] Work-from-home special message appears
- [ ] Nightlife vibe multi-select works
- [ ] Pet toggle shows/hides slider correctly

## Future Enhancements

1. **Save & Resume**: Allow users to save progress and return later
2. **Skip Logic**: More sophisticated conditional flows based on answers
3. **A/B Testing**: Test different question orders and phrasing
4. **Analytics**: Track drop-off points to identify friction
5. **Personalized Defaults**: Use location data to set smarter initial values
6. **Map Integration**: Show workplace selection on interactive map
7. **Social Proof**: "95% of users found their perfect neighborhood"
8. **Gamification**: Achievement badges for completing all questions

## File Locations

- **Main Component**: `/src/app/components/questionnaire-wizard.tsx`
- **Step Components**: `/src/app/components/steps/*.tsx`
- **Results View**: `/src/app/components/results-view.tsx`
- **API Utils**: `/src/app/utils/api.ts`
- **UI Components**: `/src/app/components/ui/*.tsx`

## Dependencies

- `motion` (v12.23.24): Animations and transitions
- `lucide-react` (v0.487.0): Icons
- `sonner` (v2.0.3): Toast notifications
- `@radix-ui/*`: UI primitives (sliders, switches, selects)
- `react-hook-form` (v7.55.0): Available but not currently used

## Performance Considerations

- **Code splitting**: Steps lazy-loaded to reduce initial bundle
- **Image optimization**: Unsplash images loaded at appropriate sizes
- **Session storage**: Minimal memory footprint for unauthenticated users
- **Animation performance**: GPU-accelerated transforms only

## Accessibility

- **Keyboard navigation**: Full support with Tab/Shift+Tab
- **ARIA labels**: Descriptive labels for screen readers
- **Focus management**: Visible focus indicators
- **Color contrast**: WCAG AA compliant
- **Touch targets**: Minimum 44x44px for mobile

---

**Last Updated**: May 13, 2026  
**Version**: 1.0.0  
**Maintained By**: NeighbourFit AI Team
