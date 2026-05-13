import { db } from "@workspace/db";
import { neighborhoodsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const NEIGHBORHOODS = [
  {
    name: "Beltline",
    slug: "beltline",
    city: "Calgary",
    identity: "Urban nightlife hub and downtown professional corridor",
    description: "Calgary's densest and most walkable inner-city community, anchored by 17th Avenue SW. The Beltline attracts young professionals who want to be at the centre of the city's energy — restaurants, bars, transit, and Culture right outside their door.",
    affordabilityScore: 3,
    walkabilityScore: 5,
    transitScore: 5,
    nightlifeScore: 5,
    safetyScore: 3,
    fitnessScore: 4,
    petFriendlinessScore: 3,
    medianRentalEstimate: 1900,
    downtownCommuteEstimateMins: 10,
    populationDensityClass: "urban",
    lifestyleTags: ["nightlife", "downtown", "transit", "restaurants", "young professionals"],
    lastReviewedDate: "2025-01-01",
    affordabilityScoreNote: "Higher rents than suburban areas; studios average $1,600–2,100/mo (MVP estimate).",
    walkabilityScoreNote: "Walk Score 97 — nearly everything is walkable.",
    transitScoreNote: "Multiple CTrain stations and frequent bus routes.",
    nightlifeScoreNote: "17th Ave SW is Calgary's premier bar and restaurant strip.",
    safetyScoreNote: "Higher density brings some urban safety considerations; generally safe but varies by block.",
    fitnessScoreNote: "Multiple gyms, yoga studios, and Elbow River pathway nearby.",
    petFriendlinessScoreNote: "Dogs welcome on patios; green space is limited vs. suburban areas.",
  },
  {
    name: "Kensington",
    slug: "kensington",
    city: "Calgary",
    identity: "Walkable café culture and community-oriented social lifestyle",
    description: "A charming, human-scale village across the river from downtown. Kensington blends independent coffee shops, boutiques, and parks with a tight-knit community feel. The Bow River pathways are minutes away.",
    affordabilityScore: 3,
    walkabilityScore: 5,
    transitScore: 3,
    nightlifeScore: 3,
    safetyScore: 4,
    fitnessScore: 3,
    petFriendlinessScore: 5,
    medianRentalEstimate: 1850,
    downtownCommuteEstimateMins: 15,
    populationDensityClass: "urban",
    lifestyleTags: ["cafes", "walkable", "community", "pets", "river access"],
    lastReviewedDate: "2025-01-01",
    petFriendlinessScoreNote: "Excellent dog parks and Bow River off-leash areas nearby.",
    walkabilityScoreNote: "Everything on Kensington Rd NW is walkable.",
  },
  {
    name: "Mission",
    slug: "mission",
    city: "Calgary",
    identity: "Trendy entertainment district with strong restaurant and bar scene",
    description: "4th Street SW is Mission's spine — lined with acclaimed restaurants, cocktail bars, and cafés. The neighbourhood has a lively, social atmosphere and strong walkability along the Elbow River.",
    affordabilityScore: 3,
    walkabilityScore: 5,
    transitScore: 4,
    nightlifeScore: 5,
    safetyScore: 3,
    fitnessScore: 3,
    petFriendlinessScore: 3,
    medianRentalEstimate: 1950,
    downtownCommuteEstimateMins: 12,
    populationDensityClass: "urban",
    lifestyleTags: ["nightlife", "restaurants", "walkable", "social", "inner-city"],
    lastReviewedDate: "2025-01-01",
    nightlifeScoreNote: "4th Street SW is one of Calgary's top dining and social corridors.",
  },
  {
    name: "Inglewood",
    slug: "inglewood",
    city: "Calgary",
    identity: "Arts and culture community; independent retail and creative industries",
    description: "Calgary's oldest neighbourhood and its creative heart. Inglewood's 9th Avenue is lined with independent shops, galleries, vintage stores, and craft breweries. A magnet for artists and creative professionals.",
    affordabilityScore: 4,
    walkabilityScore: 4,
    transitScore: 3,
    nightlifeScore: 3,
    safetyScore: 4,
    fitnessScore: 3,
    petFriendlinessScore: 4,
    medianRentalEstimate: 1600,
    downtownCommuteEstimateMins: 18,
    populationDensityClass: "mixed",
    lifestyleTags: ["arts", "culture", "local shops", "creative", "character"],
    lastReviewedDate: "2025-01-01",
    affordabilityScoreNote: "More affordable than Beltline; good value for inner-city access.",
  },
  {
    name: "Bridgeland",
    slug: "bridgeland",
    city: "Calgary",
    identity: "Balanced urban-residential blend; strong community identity and pet culture",
    description: "A beloved inner-city community with Italian heritage, excellent cafés, and a strong local identity. Bridgeland is known for its walkability, excellent parks, and the best dog-walking culture in the city.",
    affordabilityScore: 3,
    walkabilityScore: 4,
    transitScore: 3,
    nightlifeScore: 3,
    safetyScore: 4,
    fitnessScore: 4,
    petFriendlinessScore: 5,
    medianRentalEstimate: 1800,
    downtownCommuteEstimateMins: 14,
    populationDensityClass: "mixed",
    lifestyleTags: ["community", "pets", "cafes", "parks", "urban-residential"],
    lastReviewedDate: "2025-01-01",
    petFriendlinessScoreNote: "Tom Campbell's Hill Natural Park and multiple off-leash areas nearby.",
  },
  {
    name: "East Village",
    slug: "east-village",
    city: "Calgary",
    identity: "Modern downtown redevelopment with riverfront access",
    description: "A purpose-built urban renewal district along the Bow River. East Village has rapidly become one of Calgary's most walkable and transit-rich communities, with modern towers, the Central Library, and RiverWalk.",
    affordabilityScore: 3,
    walkabilityScore: 5,
    transitScore: 5,
    nightlifeScore: 4,
    safetyScore: 3,
    fitnessScore: 4,
    petFriendlinessScore: 3,
    medianRentalEstimate: 2000,
    downtownCommuteEstimateMins: 8,
    populationDensityClass: "urban",
    lifestyleTags: ["downtown", "riverfront", "modern", "transit", "walkable"],
    lastReviewedDate: "2025-01-01",
    transitScoreNote: "Adjacent to Centre Street CTrain station; excellent bus connections.",
  },
  {
    name: "Marda Loop",
    slug: "marda-loop",
    city: "Calgary",
    identity: "Young professional hub with dominant fitness and wellness culture",
    description: "Marda Loop is Calgary's wellness district — yoga studios, specialty gyms, organic cafés, and health-focused restaurants dominate. It attracts ambitious young professionals who prioritize an active lifestyle.",
    affordabilityScore: 3,
    walkabilityScore: 4,
    transitScore: 3,
    nightlifeScore: 3,
    safetyScore: 4,
    fitnessScore: 5,
    petFriendlinessScore: 4,
    medianRentalEstimate: 1800,
    downtownCommuteEstimateMins: 20,
    populationDensityClass: "mixed",
    lifestyleTags: ["fitness", "wellness", "young professionals", "restaurants", "lifestyle"],
    lastReviewedDate: "2025-01-01",
    fitnessScoreNote: "Highest concentration of fitness studios in Calgary.",
  },
  {
    name: "Sunnyside",
    slug: "sunnyside",
    city: "Calgary",
    identity: "Transit-friendly urban living with relaxed community atmosphere",
    description: "Sunnyside's proximity to the Sunnyside CTrain station makes it a commuter's dream. The neighbourhood has a relaxed, residential feel while remaining close to Kensington's amenities and the Bow River.",
    affordabilityScore: 3,
    walkabilityScore: 4,
    transitScore: 4,
    nightlifeScore: 2,
    safetyScore: 4,
    fitnessScore: 3,
    petFriendlinessScore: 5,
    medianRentalEstimate: 1750,
    downtownCommuteEstimateMins: 16,
    populationDensityClass: "urban",
    lifestyleTags: ["transit", "relaxed", "pets", "river access", "community"],
    lastReviewedDate: "2025-01-01",
  },
  {
    name: "University District",
    slug: "university-district",
    city: "Calgary",
    identity: "Purpose-built mixed-use development for students and young professionals",
    description: "A brand-new master-planned community adjacent to the University of Calgary. University District has been designed from scratch with walkability, transit, and mixed-use retail baked in — a modern urban village.",
    affordabilityScore: 4,
    walkabilityScore: 5,
    transitScore: 4,
    nightlifeScore: 3,
    safetyScore: 4,
    fitnessScore: 4,
    petFriendlinessScore: 3,
    medianRentalEstimate: 1650,
    downtownCommuteEstimateMins: 25,
    populationDensityClass: "mixed",
    lifestyleTags: ["students", "mixed-use", "modern", "walkable", "university"],
    lastReviewedDate: "2025-01-01",
    affordabilityScoreNote: "More affordable than inner-city with newer, purpose-built units.",
  },
  {
    name: "Seton",
    slug: "seton",
    city: "Calgary",
    identity: "Affordable suburban growth corridor in Calgary's southeast",
    description: "Seton is one of Calgary's newest and fastest-growing communities in the SE. It features the South Health Campus, the world's largest YMCA, and a growing retail corridor. Best value for budget-conscious renters.",
    affordabilityScore: 5,
    walkabilityScore: 3,
    transitScore: 3,
    nightlifeScore: 2,
    safetyScore: 4,
    fitnessScore: 3,
    petFriendlinessScore: 4,
    medianRentalEstimate: 1400,
    downtownCommuteEstimateMins: 40,
    populationDensityClass: "suburban",
    lifestyleTags: ["affordable", "suburban", "southeast", "families", "growth"],
    lastReviewedDate: "2025-01-01",
    affordabilityScoreNote: "Lowest rents of the 10 neighbourhoods; newest housing stock.",
    downtownCommuteEstimateMins: 40,
  },
];

async function seed() {
  console.log("Seeding neighborhoods...");
  for (const n of NEIGHBORHOODS) {
    const existing = await db.select().from(neighborhoodsTable).where(eq(neighborhoodsTable.slug, n.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(neighborhoodsTable).values(n as any);
      console.log(`  Inserted: ${n.name}`);
    } else {
      console.log(`  Skipped (exists): ${n.name}`);
    }
  }

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log("  Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set");
    return;
  }
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(usersTable).values({ email: adminEmail, passwordHash, role: "admin" });
    console.log(`  Inserted admin: ${adminEmail}`);
  } else {
    console.log(`  Admin already exists: ${adminEmail}`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
