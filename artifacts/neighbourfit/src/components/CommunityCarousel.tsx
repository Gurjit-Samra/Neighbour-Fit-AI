import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { Link } from "wouter";
import { useListNeighborhoods } from "@workspace/api-client-react";
import { DollarSign, ShieldCheck, Clock } from "lucide-react";
import { getNeighbourhoodImage } from "@/lib/neighbourhood-images";
import { cn } from "@/lib/utils";

const CARD_WIDTH  = 260;
const CARD_GAP    = 16;
const CARD_STEP   = CARD_WIDTH + CARD_GAP;
const SCROLL_SPEED = 40; // px/s

const FEATURED_SLUGS = [
  "beltline", "kensington", "mission", "inglewood", "bridgeland",
  "marda-loop", "sunnyside", "east-village", "university-district",
  "seton", "altadore", "mahogany", "auburn-bay", "aspen-woods",
  "capitol-hill", "hillhurst", "lower-mount-royal", "bowness",
];

function formatRent(v: number | null | undefined): string {
  if (!v) return "—";
  return `$${Math.round(v / 100) * 100 >= 1000
    ? `${(Math.round(v / 100) * 100 / 1000).toFixed(1)}k`
    : Math.round(v / 100) * 100}/mo`;
}

interface CarouselCardProps {
  name: string;
  slug: string;
  safetyScore: number;
  medianRentalEstimate?: number | null;
  downtownCommuteEstimateMins?: number | null;
  isSelected: boolean;
  onSelect: (slug: string) => void;
}

function CarouselCard({
  name, slug, safetyScore, medianRentalEstimate, downtownCommuteEstimateMins,
  isSelected, onSelect,
}: CarouselCardProps) {
  const imgSrc = getNeighbourhoodImage(slug);

  return (
    <Link href={`/neighborhoods/${slug}`}>
      <motion.div
        className="relative shrink-0 rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{ width: CARD_WIDTH, height: 360 }}
        animate={{
          scale:   isSelected ? 1.04 : 1,
          opacity: isSelected ? 1    : 0.82,
        }}
        whileHover={{
          scale:   1.05,
          opacity: 1,
          transition: { duration: 0.22, ease: "easeOut" },
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onHoverStart={() => onSelect(slug)}
      >
        {/* Background image */}
        <img
          src={imgSrc}
          alt={name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop&auto=format";
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Selected glow ring */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ boxShadow: "inset 0 0 0 2px rgba(0,204,153,0.7), 0 0 24px rgba(0,204,153,0.25)" }}
          />
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h3 className="text-white font-bold text-xl leading-tight mb-3 drop-shadow-md">
            {name}
          </h3>

          {/* Metrics strip */}
          <div
            className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-1"
            style={{
              background: "rgba(10,15,20,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-white leading-none">
                {formatRent(medianRentalEstimate)}
              </span>
              <span className="text-[9px] text-white/50 leading-none">Rent est.</span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex flex-col items-center gap-0.5 flex-1">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[11px] font-semibold text-white leading-none">
                {safetyScore}/5
              </span>
              <span className="text-[9px] text-white/50 leading-none">Safety</span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex flex-col items-center gap-0.5 flex-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-white leading-none">
                {downtownCommuteEstimateMins ? `~${downtownCommuteEstimateMins}m` : "—"}
              </span>
              <span className="text-[9px] text-white/50 leading-none">Commute</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function CommunityCarousel() {
  const { data: allNeighborhoods = [] } = useListNeighborhoods();

  const cards = FEATURED_SLUGS
    .map((slug) => allNeighborhoods.find((n: any) => n.slug === slug))
    .filter(Boolean) as typeof allNeighborhoods;

  const displayCards = cards.length >= 6 ? cards : (allNeighborhoods as typeof allNeighborhoods).slice(0, 18);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isPaused,     setIsPaused]     = useState(false);
  const trackRef    = useRef<HTMLDivElement>(null);
  const x           = useMotionValue(0);
  const halfWidth   = displayCards.length * CARD_STEP;

  useAnimationFrame((_, delta) => {
    if (isPaused || halfWidth === 0) return;
    let next = x.get() - (SCROLL_SPEED * delta) / 1000;
    if (next <= -halfWidth) next += halfWidth;
    x.set(next);
  });

  const handleDragEnd = useCallback(
    (_: PointerEvent, info: { offset: { x: number } }) => {
      let next = x.get() + info.offset.x;
      while (next <= -halfWidth) next += halfWidth;
      while (next > 0)            next -= halfWidth;
      x.set(next);
    },
    [x, halfWidth],
  );

  if (displayCards.length === 0) return null;

  const doubled = [...displayCards, ...displayCards];

  return (
    <section className="py-20 overflow-hidden pt-[50px] pb-[50px]">
      {/* Section header */}
      <div className="max-w-5xl mx-auto px-4 mb-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3 text-foreground">Explore communities</h2>
          <p className="text-muted-foreground">Hover to preview · Click to explore</p>
        </div>
      </div>
      {/* Carousel track */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setSelectedSlug(null); }}
      >
        {/* Left fade */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }}
        />
        {/* Right fade */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }}
        />

        <motion.div
          ref={trackRef}
          className="flex"
          style={{
            x,
            gap: CARD_GAP,
            paddingLeft: 32,
            paddingRight: 32,
            width: "max-content",
          }}
          drag="x"
          dragConstraints={{ left: -halfWidth, right: 0 }}
          dragElastic={0.05}
          onDragStart={() => setIsPaused(true)}
          onDragEnd={handleDragEnd as any}
        >
          {doubled.map((n: any, i: number) => (
            <CarouselCard
              key={`${n.slug}-${i}`}
              name={n.name}
              slug={n.slug}
              safetyScore={n.safetyScore}
              medianRentalEstimate={n.medianRentalEstimate}
              downtownCommuteEstimateMins={n.downtownCommuteEstimateMins}
              isSelected={selectedSlug === n.slug}
              onSelect={setSelectedSlug}
            />
          ))}
        </motion.div>
      </div>
      {/* Browse CTA */}
      <div className="text-center mt-10">
        <Link href="/neighborhoods">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-card text-foreground text-sm font-medium rounded-xl border border-card-border hover:shadow-sm transition-shadow">
            Explore all 200 neighbourhoods →
          </button>
        </Link>
      </div>
    </section>
  );
}
