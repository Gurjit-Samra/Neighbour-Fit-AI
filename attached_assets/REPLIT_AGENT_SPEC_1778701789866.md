# NeighbourFit AI - Complete Implementation Specification for Replit Agent

## Project Overview

Build a complete neighborhood recommendation platform for Calgary, Alberta consisting of:
1. An 8-step lifestyle questionnaire with progressive disclosure
2. A three-column interactive results page with Mapbox integration
3. Weight normalization and scoring algorithm
4. Mobile-responsive design with smooth animations

## Tech Stack Requirements

### Required Dependencies

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "mapbox-gl": "^3.23.1",
    "motion": "^12.23.24",
    "lucide-react": "^0.487.0",
    "recharts": "^2.15.2",
    "sonner": "^2.0.3",
    "tailwindcss": "^4.1.12",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.2.0",
    "class-variance-authority": "^0.7.1"
  }
}
```

### Project Structure

```
src/
├── app/
│   ├── App.tsx                          # Main entry point
│   ├── components/
│   │   ├── questionnaire-wizard.tsx     # Main questionnaire orchestrator
│   │   ├── interactive-results.tsx      # Three-column results page
│   │   ├── radar-chart.tsx              # Recharts radar visualization
│   │   ├── steps/                       # Individual question components
│   │   │   ├── budget-step.tsx
│   │   │   ├── walkability-step.tsx
│   │   │   ├── transit-step.tsx
│   │   │   ├── nightlife-step.tsx
│   │   │   ├── safety-step.tsx
│   │   │   ├── fitness-step.tsx
│   │   │   ├── pet-step.tsx
│   │   │   └── workplace-step.tsx
│   │   └── ui/                          # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── slider.tsx
│   │       ├── switch.tsx
│   │       ├── select.tsx
│   │       ├── progress.tsx
│   │       ├── badge.tsx
│   │       └── sonner.tsx
│   └── utils/
│       └── api.ts                       # API utilities
└── styles/
    ├── theme.css                        # Design tokens
    ├── globals.css                      # Global styles
    └── index.css                        # CSS imports
```

---

## Part 1: The 8-Step Questionnaire

### Data Model

```typescript
interface QuestionnaireData {
  budget: number;                  // Monthly CAD (500-5000)
  walkability: number;             // Weight 1-100
  transit: number;                 // Weight 1-100
  nightlife: number;               // Weight 1-100
  nightlifeVibe: string[];         // ["trendy", "pubs", "live-music", "social"]
  safety: number;                  // Weight 1-100
  fitness: number;                 // Weight 1-100
  hasPet: boolean;                 // Toggle
  petFriendliness: number;         // Weight 1-100 (if hasPet=true)
  workplace: string;               // Selected from dropdown
}
```

### Step 1: Budget (Required)

**Input Type**: Slider (500-5000) + Numeric Input

**Features**:
- Dual control: slider + direct number input
- Calgary median rent: $1,800
- Affordability warning if budget < $1,260 (70% of median)
- Reference pricing guide: Shared Room ($600-900), 1BR ($1,400-2,000), 2BR ($1,800-2,800)

**UI Design**:
- Green gradient background (`from-green-50 to-emerald-50`)
- Dollar sign icon in green circle
- Large displayed value: `$X,XXX/mo`

**Code Example**:
```tsx
const CALGARY_MEDIAN_RENT = 1800;
const AFFORDABLE_THRESHOLD = 0.7;

{budget < CALGARY_MEDIAN_RENT * AFFORDABLE_THRESHOLD && (
  <Alert variant="destructive">
    Your budget is significantly below Calgary's median rent...
  </Alert>
)}
```

### Step 2: Walkability (Required)

**Input Type**: Slider (1-100)

**Label**: "How important is it to run errands on foot?"

**Features**:
- Real-time value display in circular badge
- Neighborhood examples: High walkability (Kensington, Inglewood) vs Car-dependent (Suburban)
- Orange/amber gradient theme

**UI Components**:
- Footprints icon
- Min/Max labels: "Not Important" / "Very Important"
- Circular value display with orange background

### Step 3: Transit (Required)

**Input Type**: Slider (1-100)

**Label**: "How much do you rely on C-Train or bus access?"

**Features**:
- Blue/cyan gradient theme
- Train icon
- Calgary-specific: Red Line (Downtown, Beltline, Somerset) and Blue Line (Bridgeland, Ramsay, Saddletowne) examples

### Step 4: Nightlife & Social (Required)

**Input Type**: Slider (1-100) + Multi-select Vibe Cards

**Vibe Options**:
```typescript
const VIBE_OPTIONS = [
  { id: "trendy", label: "Trendy Restaurants", icon: Utensils, color: "bg-pink-500" },
  { id: "pubs", label: "Quiet Pubs", icon: Wine, color: "bg-amber-500" },
  { id: "live-music", label: "Live Music", icon: Music, color: "bg-purple-500" },
  { id: "social", label: "Social Hubs", icon: Users, color: "bg-blue-500" }
];
```

**Features**:
- Purple/pink gradient theme
- Music icon
- Visual card selectors with icon + label
- Multi-select (array of strings)
- Selected cards have purple border + purple background

### Step 5: Safety (Required)

**Input Type**: Slider (1-100)

**Label**: "Priority for well-lit streets and low crime rates"

**Features**:
- Emerald/teal gradient theme
- Shield icon
- Examples: High safety rating areas, Community watch programs

### Step 6: Fitness & Wellness (Required)

**Input Type**: Slider (1-100)

**Label**: "Proximity to gyms, yoga studios, or the River Pathway system"

**Features**:
- Red/orange gradient theme
- Dumbbell icon
- Calgary-specific: Bow & Elbow River pathways, GoodLife, YMCA references

### Step 7: Pet-Friendliness (Optional)

**Input Type**: Toggle + Conditional Slider

**Flow**:
1. Toggle: "Do you have a pet?"
2. If YES → Show slider (1-100)
3. If NO → Skip, use default weight in normalization

**Features**:
- Yellow/orange gradient theme
- Dog icon
- Examples: Sue Higgins Park, Sandy Beach dog parks
- Pet-friendly building info

### Step 8: Workplace/School (Required)

**Input Type**: Dropdown Select

**Options**:
```typescript
const CALGARY_NEIGHBORHOODS = [
  { value: "downtown", label: "Downtown Core" },
  { value: "beltline", label: "Beltline" },
  { value: "uofC", label: "University of Calgary" },
  { value: "sait", label: "SAIT" },
  { value: "stampede-park", label: "Stampede Park" },
  { value: "southeast", label: "Southeast Industrial" },
  { value: "northeast", label: "Northeast Industrial" },
  { value: "northwest", label: "Northwest" },
  { value: "chinook", label: "Chinook Centre Area" },
  { value: "wfh", label: "Work From Home" },
  { value: "other", label: "Other / Multiple Locations" }
];
```

**Features**:
- Indigo/blue gradient theme
- Building2 icon
- Privacy notice: "We only collect general area, not exact address"
- Special message if WFH selected: "We'll prioritize neighborhoods with cafes and co-working spaces"

---

## Questionnaire UI Requirements

### Progressive Disclosure

**Layout**:
- ONE question per screen (card-based)
- Progress bar showing `(currentStep + 1) / 8 * 100%`
- Step indicator: "Step X of 8: [Category Name]"
- Question description as h3 heading

**Navigation**:
- Back button (disabled on step 1)
- Next button (or "Get Recommendations" on step 8)
- Back preserves all previous answers
- Validation before proceeding

### Animations

**Using Motion (Framer Motion)**:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* Step content */}
  </motion.div>
</AnimatePresence>
```

**Requirements**:
- 300ms slide transitions between steps
- Horizontal slide (x: 20 → 0 → -20)
- Fade opacity (0 → 1 → 0)
- GPU-accelerated (use transforms only)

### Visual Design

**Card Structure**:
```tsx
<Card className="w-full max-w-2xl shadow-xl">
  <CardHeader>
    <Progress value={progress} />
    <CardTitle>Find Your Perfect Calgary Neighborhood</CardTitle>
    <CardDescription>Step {currentStep + 1} of 8</CardDescription>
  </CardHeader>
  <CardContent className="min-h-[400px]">
    {/* Question component */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline" onClick={handleBack}>Back</Button>
    <Button onClick={handleNext}>Next</Button>
  </CardFooter>
</Card>
```

**Background**:
- Gradient: `bg-gradient-to-br from-blue-50 to-indigo-100`
- Dark mode: `dark:from-gray-900 dark:to-gray-800`
- Full viewport height: `min-h-screen`

---

## Weight Normalization Algorithm

### The Rule of 100

All user-defined weights MUST sum to exactly 100% before submission.

### Implementation

```typescript
function normalizeWeights(data: QuestionnaireData): Record<string, number> {
  // Step 1: Collect weights (affordability fixed at 20%)
  const weights = {
    affordability: 20,
    walkability: data.walkability,
    transit: data.transit,
    nightlife: data.nightlife,
    safety: data.safety,
    fitness: data.fitness,
    petFriendliness: data.hasPet ? data.petFriendliness : 0,
  };

  // Step 2: Calculate total (excluding fixed affordability)
  const userWeightsTotal =
    weights.walkability +
    weights.transit +
    weights.nightlife +
    weights.safety +
    weights.fitness +
    (data.hasPet ? weights.petFriendliness : 0);

  // Step 3: Normalize to ensure total = 100
  const targetTotal = 80; // 100 - 20 (affordability)
  const scaleFactor = targetTotal / userWeightsTotal;

  // Step 4: Apply scale factor and round
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

If all sliders left at default (50):
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

**Warning Display**:
```tsx
{usedDefaults && (
  <Toast variant="warning">
    Your results use default weights for some questions. 
    Adjust sliders for a more personalized result.
  </Toast>
)}
```

---

## Part 2: Interactive Results Page

### Three-Column Layout

```
┌──────────────┬─────────────────┬──────────────────┐
│ Left Sidebar │   Center Map    │  Right Sidebar   │
│   (25vw)     │     (40vw)      │     (35vw)       │
│              │                 │                  │
│  Contenders  │  Mapbox GL JS   │   Deep Dive      │
│  #2-#5 List  │  Custom Markers │   Selected Info  │
└──────────────┴─────────────────┴──────────────────┘
```

**Flexbox Implementation**:
```tsx
<div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-slate-900">
  {/* Left: 25vw */}
  <div className="w-full lg:w-[25vw] bg-slate-800/90 backdrop-blur-sm">
    {/* Contenders list */}
  </div>
  
  {/* Center: 40vw */}
  <div className="relative flex-1 lg:w-[40vw]">
    <div ref={mapContainer} className="w-full h-full" />
  </div>
  
  {/* Right: 35vw */}
  <div className="w-full lg:w-[35vw] bg-slate-800">
    {/* Deep dive content */}
  </div>
</div>
```

---

## Left Sidebar: The Contenders

### Design Specifications

**Background**: Glassmorphic dark slate
- `bg-slate-800/90 backdrop-blur-sm`
- Border right: `border-r border-slate-700`

**Content**: Vertical scrollable list of neighborhoods #1-#5

### Mini Card Structure

```tsx
<Card
  className={`cursor-pointer transition-all hover:shadow-lg ${
    selected ? "ring-2 ring-teal-500 bg-slate-700" : "bg-slate-800/50"
  }`}
  onClick={() => handleNeighborhoodClick(neighborhood)}
>
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <Badge className={index === 0 ? "bg-red-500" : "bg-teal-500"}>
          #{index + 1}
        </Badge>
        {index === 0 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
        
        <h3 className="text-white">{neighborhood.name}</h3>
        
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span><TrendingUp /> {compatibilityScore}% Match</span>
          <span><Award /> Walk: {walkScore}</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Interaction Behavior

**Click Handler**:
```typescript
const handleNeighborhoodClick = (neighborhood: NeighborhoodData) => {
  setSelectedNeighborhood(neighborhood);
  map.current?.flyTo({
    center: neighborhood.coordinates,
    zoom: 13,
    duration: 1500,
  });
};
```

**Staggered Animation**:
```tsx
{CALGARY_NEIGHBORHOODS.map((neighborhood, index) => (
  <motion.div
    key={neighborhood.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    {/* Card */}
  </motion.div>
))}
```

---

## Center Section: The Live Map

### Mapbox GL JS Setup

**Initialization**:
```typescript
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN_HERE";
// For production: Use import.meta.env.VITE_MAPBOX_TOKEN

mapboxgl.accessToken = MAPBOX_TOKEN;

useEffect(() => {
  if (!mapContainer.current || map.current) return;

  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: "mapbox://styles/mapbox/outdoors-v12",
    center: [-114.0719, 51.0447], // Calgary downtown
    zoom: 11.5,
  });

  map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

  return () => {
    map.current?.remove();
    map.current = null;
  };
}, []);
```

### Custom Markers

**#1 Match (Red Star)**:
```typescript
const createStarMarker = () => {
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.style.width = "40px";
  el.style.height = "40px";
  el.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
      <path d="M20 12l2.5 5.5 6 .9-4.4 4.3 1 6.3-5.1-2.7-5.1 2.7 1-6.3-4.4-4.3 6-.9z" fill="white"/>
    </svg>
  `;
  return el;
};
```

**Others (Teal Pin)**:
```typescript
const createPinMarker = () => {
  const el = document.createElement("div");
  el.className = "custom-marker";
  el.style.width = "40px";
  el.style.height = "40px";
  el.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M20 5c-6.6 0-12 5.4-12 12 0 9 12 18 12 18s12-9 12-18c0-6.6-5.4-12-12-12z" 
            fill="#14b8a6" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="17" r="4" fill="white"/>
    </svg>
  `;
  return el;
};
```

**Adding Markers**:
```typescript
CALGARY_NEIGHBORHOODS.forEach((neighborhood, index) => {
  const el = index === 0 ? createStarMarker() : createPinMarker();
  
  const marker = new mapboxgl.Marker(el)
    .setLngLat(neighborhood.coordinates)
    .addTo(map.current!);
  
  el.addEventListener("click", () => {
    setSelectedNeighborhood(neighborhood);
    map.current?.flyTo({
      center: neighborhood.coordinates,
      zoom: 13,
      duration: 1500,
    });
  });
  
  markers.current.push(marker);
});
```

### Map Footer Overlay

```tsx
<div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm 
                text-slate-300 text-xs p-3 border-t border-slate-700">
  <div className="flex items-center gap-2">
    <Navigation className="h-3 w-3" />
    <span>
      Commute estimate assumes a downtown Calgary destination. 
      Source: City of Calgary Open Data.
    </span>
  </div>
</div>
```

---

## Right Sidebar: The Deep Dive

### Hero Image Section

```tsx
<div className="relative h-64 overflow-hidden">
  <img
    src={selectedNeighborhood.image}
    alt={selectedNeighborhood.name}
    className="w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
  
  <div className="absolute bottom-6 left-6 right-6">
    <Badge className="bg-teal-500 text-white">
      {compatibilityScore}% Lifestyle Fit
    </Badge>
    <Badge variant="outline" className="text-white border-white">
      ${rentMin}-${rentMax}/mo
    </Badge>
    
    <h1 className="text-white text-3xl">{name}</h1>
    
    <div className="flex items-center gap-2 text-slate-200">
      <MapPin className="h-4 w-4" />
      <span>{commuteTime}</span>
    </div>
  </div>
</div>
```

### Scores Overview (3-Column Grid)

```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
    <div className="text-2xl text-teal-400">{walkScore}</div>
    <div className="text-xs text-slate-400">Walk Score</div>
  </div>
  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
    <div className="text-2xl text-blue-400">{transitScore}</div>
    <div className="text-xs text-slate-400">Transit Score</div>
  </div>
  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
    <div className="text-2xl text-green-400">{bikeScore}</div>
    <div className="text-xs text-slate-400">Bike Score</div>
  </div>
</div>
```

### Radar Chart Component

**Using Recharts**:
```tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export function RadarChartComponent({ scores }) {
  const data = [
    { dimension: "Walkability", value: scores.walkability, fullMark: 100 },
    { dimension: "Transit", value: scores.transit, fullMark: 100 },
    { dimension: "Nightlife", value: scores.nightlife, fullMark: 100 },
    { dimension: "Safety", value: scores.safety, fullMark: 100 },
    { dimension: "Fitness", value: scores.fitness, fullMark: 100 },
    { dimension: "Affordability", value: scores.affordability, fullMark: 100 },
    { dimension: "Pet-Friendly", value: scores.petFriendliness, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#475569" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#cbd5e1", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#14b8a6"
          fill="#14b8a6"
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

### AI Narrative Card

```tsx
<Card className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 border-slate-600">
  <CardHeader>
    <CardTitle className="text-white flex items-center gap-2">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      AI Lifestyle Fit Analysis
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-slate-200 leading-relaxed">
      {selectedNeighborhood.aiSummary}
    </p>
  </CardContent>
</Card>
```

### Sidebar Animation

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={selectedNeighborhood.id}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* All sidebar content */}
  </motion.div>
</AnimatePresence>
```

---

## Neighborhood Data Structure

### TypeScript Interface

```typescript
interface NeighborhoodData {
  id: number;
  name: string;
  compatibilityScore: number;       // 0-100 match %
  coordinates: [number, number];    // [longitude, latitude] for Mapbox
  walkScore: number;                // 0-100
  transitScore: number;             // 0-100
  bikeScore: number;                // 0-100
  image: string;                    // Unsplash or CDN URL
  estimatedRent: {
    min: number;
    max: number;
  };
  commuteTime: string;              // e.g. "15 min to Downtown"
  aiSummary: string;                // 4-6 sentences from GPT-4o-mini
  scores: {
    walkability: number;            // 7 lifestyle dimensions
    transit: number;
    nightlife: number;
    safety: number;
    fitness: number;
    affordability: number;
    petFriendliness: number;
  };
  highlights: string[];             // 4-5 key features
}
```

### Mock Data (5 Calgary Neighborhoods)

```typescript
const CALGARY_NEIGHBORHOODS: NeighborhoodData[] = [
  {
    id: 1,
    name: "Kensington",
    compatibilityScore: 92,
    coordinates: [-114.0856, 51.0535],
    walkScore: 95,
    transitScore: 88,
    bikeScore: 92,
    image: "https://images.unsplash.com/photo-1761790184885-f1122aed0080?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    estimatedRent: { min: 1800, max: 2400 },
    commuteTime: "15 min to Downtown",
    aiSummary: "Kensington offers an exceptional lifestyle balance with its vibrant pedestrian-friendly streets along Kensington Road. The neighborhood excels in walkability with 30+ restaurants, cafes, and boutiques within a 5-minute walk. Direct access to the Bow River pathway makes it ideal for fitness enthusiasts, while maintaining a safe, community-oriented atmosphere. The mix of heritage homes and modern condos provides diverse housing options, though prices reflect the premium location.",
    scores: {
      walkability: 95,
      transit: 88,
      nightlife: 85,
      safety: 90,
      fitness: 92,
      affordability: 65,
      petFriendliness: 88,
    },
    highlights: [
      "30+ restaurants within walking distance",
      "Direct Bow River pathway access",
      "Safe, family-friendly atmosphere",
      "Excellent walkability (95/100)",
    ],
  },
  {
    id: 2,
    name: "Beltline",
    compatibilityScore: 88,
    coordinates: [-114.0719, 51.0386],
    walkScore: 98,
    transitScore: 95,
    bikeScore: 85,
    image: "https://images.unsplash.com/photo-1593140157773-eae039702906?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    estimatedRent: { min: 1600, max: 2200 },
    commuteTime: "10 min to Downtown",
    aiSummary: "Beltline is Calgary's most urban neighborhood, offering unparalleled transit access with multiple C-Train stations and extensive bus routes. The area buzzes with energy from 17th Avenue's restaurant scene and Victoria Park's entertainment district. Young professionals appreciate the walkable lifestyle and competitive rent prices. However, nightlife activity means increased noise levels, and parking can be challenging for car owners.",
    scores: {
      walkability: 98,
      transit: 95,
      nightlife: 95,
      safety: 75,
      fitness: 85,
      affordability: 80,
      petFriendliness: 70,
    },
    highlights: [
      "Multiple C-Train stations nearby",
      "Vibrant 17th Avenue nightlife",
      "Walking distance to downtown",
      "Affordable for central location",
    ],
  },
  {
    id: 3,
    name: "Inglewood",
    compatibilityScore: 85,
    coordinates: [-114.0383, 51.0403],
    walkScore: 90,
    transitScore: 75,
    bikeScore: 88,
    image: "https://images.unsplash.com/photo-1563772770586-c4edcb11e75d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    estimatedRent: { min: 1700, max: 2300 },
    commuteTime: "12 min to Downtown",
    aiSummary: "Inglewood blends historic charm with modern amenities, creating a unique community atmosphere. As Calgary's oldest neighborhood, it features heritage buildings housing independent boutiques, craft breweries, and the Calgary Farmers' Market. The Bow River pathway and nearby Fish Creek Park provide excellent outdoor recreation. Transit is less frequent than inner-city neighborhoods, but the strong community feel and local events compensate for car-dependent aspects.",
    scores: {
      walkability: 90,
      transit: 75,
      nightlife: 80,
      safety: 88,
      fitness: 90,
      affordability: 75,
      petFriendliness: 92,
    },
    highlights: [
      "Historic character with modern amenities",
      "Calgary Farmers' Market access",
      "Strong community events",
      "Excellent parks and trails",
    ],
  },
  {
    id: 4,
    name: "Mission",
    compatibilityScore: 83,
    coordinates: [-114.0808, 51.0314],
    walkScore: 92,
    transitScore: 85,
    bikeScore: 90,
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=400&fit=crop",
    estimatedRent: { min: 1750, max: 2500 },
    commuteTime: "8 min to Downtown",
    aiSummary: "Mission offers a sophisticated urban lifestyle with tree-lined streets and heritage architecture. 4th Street SW provides upscale dining and shopping, while maintaining a quieter residential feel than Beltline. The Elbow River pathway and proximity to multiple fitness studios appeal to active residents. Higher rent reflects the desirable location, but the neighborhood's balance of walkability and tranquility justifies the premium.",
    scores: {
      walkability: 92,
      transit: 85,
      nightlife: 82,
      safety: 92,
      fitness: 88,
      affordability: 65,
      petFriendliness: 85,
    },
    highlights: [
      "Upscale 4th Street shopping district",
      "Elbow River pathway access",
      "Tree-lined quiet streets",
      "High safety rating",
    ],
  },
  {
    id: 5,
    name: "Bridgeland",
    compatibilityScore: 81,
    coordinates: [-114.0583, 51.0597],
    walkScore: 88,
    transitScore: 92,
    bikeScore: 86,
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=400&fit=crop",
    estimatedRent: { min: 1650, max: 2100 },
    commuteTime: "10 min to Downtown",
    aiSummary: "Bridgeland has evolved into a hip, artistic neighborhood with excellent Blue Line C-Train access. The area attracts young professionals and creatives with its diverse restaurant scene, including Italian heritage establishments and trendy new eateries. Proximity to SAIT and the growing tech corridor adds to its appeal. The neighborhood feels more spacious than Beltline while maintaining strong transit connectivity.",
    scores: {
      walkability: 88,
      transit: 92,
      nightlife: 85,
      safety: 85,
      fitness: 80,
      affordability: 78,
      petFriendliness: 82,
    },
    highlights: [
      "Blue Line C-Train access",
      "Diverse restaurant scene",
      "Growing tech corridor proximity",
      "Artistic community vibe",
    ],
  },
];
```

---

## Styling Requirements

### Tailwind CSS v4 Configuration

**Theme Tokens** (`src/styles/theme.css`):
```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --muted: #ececf0;
  --muted-foreground: #717182;
  --border: rgba(0, 0, 0, 0.1);
  --destructive: #d4183d;
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --primary: oklch(0.985 0 0);
  --border: oklch(0.269 0 0);
}
```

**Global Styles** (`src/styles/globals.css`):
```css
/* Mapbox custom marker styles */
.custom-marker {
  transition: transform 0.2s ease;
}

.custom-marker:hover {
  transform: scale(1.1);
}

/* Mapbox attribution dark theme */
.mapboxgl-ctrl-attrib {
  background-color: rgba(30, 41, 59, 0.9) !important;
  color: #cbd5e1 !important;
}

.mapboxgl-ctrl-attrib a {
  color: #14b8a6 !important;
}
```

### Color Palette

**Questionnaire Step Colors**:
- Budget: Green (`from-green-50 to-emerald-50`)
- Walkability: Orange (`from-orange-50 to-amber-50`)
- Transit: Blue (`from-blue-50 to-cyan-50`)
- Nightlife: Purple (`from-purple-50 to-pink-50`)
- Safety: Emerald (`from-emerald-50 to-teal-50`)
- Fitness: Red (`from-red-50 to-orange-50`)
- Pet: Yellow (`from-yellow-50 to-orange-50`)
- Workplace: Indigo (`from-indigo-50 to-blue-50`)

**Interactive Results Colors**:
- Background: Slate 900 (`bg-slate-900`)
- Sidebar: Slate 800 (`bg-slate-800`)
- Accent: Teal 500 (`#14b8a6`)
- #1 Match: Red 500 (`#ef4444`)
- Text: Slate 200-300 for readability

---

## Responsive Design

### Desktop (≥1024px)
- Three-column horizontal layout
- Sidebars fixed width (25vw, 35vw)
- Map fluid center (40vw)

### Tablet/Mobile (<1024px)
```tsx
className="w-full lg:w-[25vw]"          // Full width on mobile
className="flex flex-col lg:flex-row"  // Stack vertically
```

**Mobile Layout**:
- Stacked vertical: Sidebar → Map → Sidebar
- Each section takes full width
- Map height: `h-64` on mobile vs `h-auto` on desktop
- Maintain scrollability for each section

---

## API Integration (Future)

### Questionnaire Submission Endpoint

**POST** `/api/recommendations`

**Request Body**:
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

**Response**:
```json
[
  {
    "id": 1,
    "name": "Kensington",
    "compatibilityScore": 92,
    "coordinates": [-114.0856, 51.0535],
    ...
  }
]
```

### AI Summary Generation (Optional Enhancement)

If implementing dynamic AI summaries:

```typescript
async function generateNeighborhoodSummary(
  neighborhoodName: string,
  userWeights: Record<string, number>
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a Calgary real estate expert. Generate a 4-6 sentence lifestyle fit analysis for neighborhoods based on user priorities."
      },
      {
        role: "user",
        content: `Neighborhood: ${neighborhoodName}\nUser priorities: ${JSON.stringify(userWeights)}\n\nGenerate a narrative explaining why this neighborhood matches or doesn't match the user's lifestyle.`
      }
    ],
    max_tokens: 200,
  });
  
  return response.choices[0].message.content;
}
```

---

## Testing Requirements

### Functional Tests

**Questionnaire Flow**:
- [ ] Navigate through all 8 steps
- [ ] Back button preserves data
- [ ] Validation prevents submission with missing fields
- [ ] Budget warning triggers at correct threshold
- [ ] Pet toggle shows/hides slider
- [ ] Nightlife multi-select works
- [ ] Workplace dropdown functional
- [ ] Weights normalize to 100%
- [ ] Toast notifications appear

**Interactive Results**:
- [ ] Map loads with correct center/zoom
- [ ] 5 custom markers appear
- [ ] #1 match has red star marker
- [ ] Click left card → Map flies to location
- [ ] Click marker → Right sidebar updates
- [ ] Sidebar content animates smoothly
- [ ] Radar chart renders correctly
- [ ] Footer disclaimer visible
- [ ] Restart button returns to questionnaire

### Browser Testing

- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] iOS Safari (mobile)
- [ ] Android Chrome (mobile)

### Performance Checks

- [ ] Map loads in <2 seconds
- [ ] Animations run at 60fps
- [ ] No memory leaks on questionnaire restart
- [ ] Markers cleanup on unmount
- [ ] Images load progressively

---

## Success Criteria

### Questionnaire
- ✅ >75% completion rate (8/8 steps)
- ✅ <5 minutes average completion time
- ✅ Weights sum to exactly 100%
- ✅ All sliders functional on mobile

### Interactive Results
- ✅ Map tiles load successfully
- ✅ Click interactions work on first try
- ✅ Animations smooth (no jank)
- ✅ Responsive on mobile devices
- ✅ All 5 neighborhoods visible

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Install all dependencies via `pnpm install`
- [ ] Set up Tailwind CSS v4
- [ ] Create project folder structure
- [ ] Add Mapbox token (development or production)

### Phase 2: UI Components
- [ ] Build base components (Button, Card, Slider, etc.)
- [ ] Create utility functions (cn, tailwind-merge)
- [ ] Set up theme.css with color tokens
- [ ] Test component rendering

### Phase 3: Questionnaire
- [ ] Build QuestionnaireWizard container
- [ ] Create all 8 step components
- [ ] Implement navigation (Back/Next)
- [ ] Add progress bar
- [ ] Implement animations with Motion
- [ ] Add validation logic
- [ ] Implement weight normalization
- [ ] Add toast notifications

### Phase 4: Interactive Results
- [ ] Initialize Mapbox GL JS
- [ ] Create custom SVG markers
- [ ] Add marker click handlers
- [ ] Build left sidebar (contenders list)
- [ ] Build right sidebar (deep dive)
- [ ] Create RadarChart component
- [ ] Add sidebar animations
- [ ] Implement map flyTo on selection
- [ ] Add footer disclaimer

### Phase 5: Integration
- [ ] Connect questionnaire to results page
- [ ] Pass weights and data correctly
- [ ] Add restart functionality
- [ ] Test complete user flow

### Phase 6: Polish
- [ ] Add responsive styles
- [ ] Test on mobile devices
- [ ] Optimize performance
- [ ] Add accessibility features
- [ ] Write documentation

---

## Environment Variables

Create `.env` file:
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGhqNXNsZGswMTBl...
```

**Security**:
- Add `.env` to `.gitignore`
- Never commit tokens
- Use Mapbox URL restrictions in production

---

## Common Troubleshooting

### Map Not Loading
- Verify Mapbox token is valid
- Check `mapbox-gl.css` is imported
- Ensure container has height set
- Check browser console for errors

### Markers Not Appearing
- Verify coordinates format: `[lng, lat]` not `[lat, lng]`
- Check zoom level
- Inspect SVG rendering in DevTools

### Animations Glitchy
- Ensure `AnimatePresence mode="wait"`
- Check for conflicting CSS transitions
- Verify unique `key` props

### Weights Don't Sum to 100
- Check normalization function
- Verify rounding logic
- Test with edge cases (all 1s, all 100s)

---

## Production Deployment

### Checklist
- [ ] Replace Mapbox demo token with production token
- [ ] Update Calgary median rent data (currently $1,800)
- [ ] Add error logging (Sentry, LogRocket)
- [ ] Configure analytics (GA4, Mixpanel)
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add meta tags for SEO
- [ ] Test with real users
- [ ] Monitor completion rates

---

## Future Enhancements

**Backend Integration**:
- Supabase for neighborhood database
- AI summary caching (GPT-4o-mini)
- User accounts and saved searches
- Real-time scoring algorithm

**Features**:
- 20+ Calgary neighborhoods
- Walk Score API integration
- Rental listing integration (Rentfaster.ca)
- Street View imagery
- Neighborhood comparison mode
- Social sharing
- Email reports

**UX Improvements**:
- Mobile bottom drawer for sidebars
- Virtual scrolling for large lists
- Skeleton loaders
- Offline map tiles (service worker)
- Keyboard shortcuts
- High contrast mode

---

## Credits & Resources

- **Mapbox**: Map tiles and geocoding
- **Unsplash**: Neighborhood photography
- **Recharts**: Data visualization library
- **Motion (Framer Motion)**: Animation library
- **Lucide React**: Icon library
- **Radix UI**: Headless UI primitives
- **Tailwind CSS**: Utility-first CSS framework

---

## Summary

This specification provides everything needed to build a complete neighborhood recommendation platform:

1. **8-Step Questionnaire** with progressive disclosure, validation, and weight normalization
2. **Three-Column Interactive Results** with Mapbox integration, custom markers, and radar charts
3. **Mobile-responsive design** with smooth animations
4. **Mock data** for 5 Calgary neighborhoods with real coordinates and AI summaries
5. **Complete styling** using Tailwind CSS v4 with dark mode support

**Total Deliverables**:
- 13+ React components
- 2,500+ lines of code
- Complete UI/UX implementation
- Ready for backend integration

**Time Estimate**: 6-8 hours for experienced developer

---

**Last Updated**: May 13, 2026  
**Version**: 1.0.0  
**Status**: Complete Specification Ready for Implementation
