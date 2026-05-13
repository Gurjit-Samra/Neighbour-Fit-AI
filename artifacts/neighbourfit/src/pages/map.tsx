import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { AnimatePresence, motion } from "framer-motion";
import { useCreateRecommendation } from "@workspace/api-client-react";
import { loadQuestionnaire, DEFAULT_WEIGHTS } from "@/lib/questionnaire-store";
import { Link } from "wouter";
import {
  Search,
  X,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  ArrowRight,
  GitCompare,
  Loader2,
  Navigation,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";

const CALGARY_CENTER = { lat: 51.0447, lng: -114.0719 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NIGHT_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "administrative.land_parcel", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d2318" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#1e4d33" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#243b5e" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#1e293b" }] },
];

const PINS = [
  { slug: "beltline", name: "Beltline", lat: 51.0386, lng: -114.0719 },
  { slug: "kensington", name: "Kensington", lat: 51.0535, lng: -114.0856 },
  { slug: "mission", name: "Mission", lat: 51.0314, lng: -114.0808 },
  { slug: "inglewood", name: "Inglewood", lat: 51.0403, lng: -114.0383 },
  { slug: "bridgeland", name: "Bridgeland", lat: 51.0597, lng: -114.0583 },
  { slug: "east-village", name: "East Village", lat: 51.0450, lng: -114.0550 },
  { slug: "marda-loop", name: "Marda Loop", lat: 51.0280, lng: -114.0950 },
  { slug: "sunnyside", name: "Sunnyside", lat: 51.0542, lng: -114.0828 },
  { slug: "university-district", name: "University District", lat: 51.0745, lng: -114.1280 },
  { slug: "seton", name: "Seton", lat: 50.9615, lng: -113.9980 },
];

function pinColor(rank: number | null) {
  if (rank === 1) return "#10b981";
  if (rank !== null && rank <= 9) return "#f59e0b";
  return "#475569";
}

function fitLabelColor(label: string) {
  if (label?.startsWith("Excellent")) return "text-emerald-400";
  if (label?.startsWith("Strong")) return "text-teal-400";
  if (label?.startsWith("Moderate")) return "text-amber-400";
  return "text-orange-400";
}

function createPinSVG(color: string, label: string): string {
  const svg = `<svg width="38" height="50" viewBox="0 0 38 50" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="s" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <path d="M19 0C8.507 0 0 8.507 0 19c0 14.25 19 31 19 31S38 33.25 38 19C38 8.507 29.493 0 19 0z"
        fill="${color}" filter="url(#s)"/>
  <circle cx="19" cy="19" r="11" fill="white" fill-opacity="0.92"/>
  <text x="19" y="23" text-anchor="middle" fill="${color}"
        font-size="${label.length > 1 ? "9" : "11"}" font-weight="800"
        font-family="-apple-system,system-ui,sans-serif">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createClusterSVG(count: number): string {
  const svg = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="20" fill="#0f172a" stroke="#14b8a6" stroke-width="2" opacity="0.95"/>
  <text x="24" y="29" text-anchor="middle" fill="#14b8a6"
        font-size="${count > 99 ? "10" : "12"}" font-weight="700"
        font-family="-apple-system,system-ui,sans-serif">${count}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const SCORE_DIMS = [
  { key: "affordabilityScore", label: "Affordability" },
  { key: "walkabilityScore", label: "Walkability" },
  { key: "transitScore", label: "Transit" },
  { key: "nightlifeScore", label: "Nightlife" },
  { key: "safetyScore", label: "Safety" },
  { key: "fitnessScore", label: "Fitness" },
  { key: "petFriendlinessScore", label: "Pets" },
] as const;

// ─── API Key missing screen ──────────────────────────────────────────────────

function ApiKeyMissing() {
  return (
    <div className="h-[calc(100vh-56px)] bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="h-7 w-7 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Google Maps API Key Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              To enable the interactive map, add your Google Maps JavaScript API key as a Replit secret.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Setup steps</p>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Open <strong className="text-slate-300">Google Cloud Console</strong> → APIs &amp; Services</li>
              <li>Enable <strong className="text-slate-300">Maps JavaScript API</strong></li>
              <li>Create an API key (restrict to your domain)</li>
              <li>Add to Replit Secrets as <code className="bg-slate-700 px-1 py-0.5 rounded text-teal-300 font-mono">VITE_GOOGLE_MAPS_API_KEY</code></li>
            </ol>
          </div>
          <Link href="/">
            <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Map Page ───────────────────────────────────────────────────────────

export default function MapPage() {
  if (!API_KEY) return <ApiKeyMissing />;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerMapRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mapReady, setMapReady] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<any[]>([]);

  const createRec = useCreateRecommendation();

  // Load questionnaire & fetch match scores
  useEffect(() => {
    const q = loadQuestionnaire();
    const weights = q?.weights ?? DEFAULT_WEIGHTS;
    createRec.mutate({
      data: {
        budget: q?.budget ?? 1800,
        weights,
        workplaceNeighborhood: q?.workplaceNeighborhood ?? undefined,
        usedDefaultWeights: !q,
      },
    });
  }, []);

  useEffect(() => {
    if (createRec.data?.matches) {
      setMatches(createRec.data.matches as any[]);
    }
  }, [createRec.data]);

  // Rank helper
  const getRank = useCallback(
    (slug: string): number | null => {
      const idx = matches.findIndex((m: any) => m.neighborhood?.slug === slug);
      return idx === -1 ? null : idx + 1;
    },
    [matches]
  );

  // Build/rebuild markers whenever map is ready or matches change
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    const map = googleMapRef.current;

    // Destroy existing clusterer first
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    // Clear old markers
    markerMapRef.current.forEach((m) => m.setMap(null));
    markerMapRef.current.clear();

    const newMarkers: google.maps.Marker[] = [];

    PINS.forEach((pin) => {
      const rank = getRank(pin.slug);
      const color = pinColor(rank);
      const label = rank !== null ? String(rank) : "•";

      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        icon: {
          url: createPinSVG(color, label),
          scaledSize: new google.maps.Size(38, 50),
          anchor: new google.maps.Point(19, 50),
        },
        title: pin.name,
        optimized: false,
        zIndex: rank === 1 ? 1000 : rank !== null ? 500 : 100,
      });

      marker.addListener("click", () => handlePinClick(pin.slug, pin));
      markerMapRef.current.set(pin.slug, marker);
      newMarkers.push(marker);
    });

    // Set up clusterer
    clustererRef.current = new MarkerClusterer({
      map,
      markers: newMarkers,
      algorithm: new SuperClusterAlgorithm({ radius: 80, minZoom: 0, maxZoom: 10 }),
      renderer: {
        render({ count, position }) {
          return new google.maps.Marker({
            position,
            icon: {
              url: createClusterSVG(count),
              scaledSize: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 24),
            },
            title: `${count} neighbourhoods`,
            zIndex: 2000,
          });
        },
      },
    });
  }, [mapReady, matches, getRank]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainerRef.current || !API_KEY) return;

    setOptions({ key: API_KEY, v: "weekly" });

    importLibrary("maps").then(() => {
      if (!mapContainerRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: CALGARY_CENTER,
        zoom: 12,
        styles: NIGHT_STYLE,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        backgroundColor: "#0f172a",
      });

      googleMapRef.current = map;
      setMapReady(true);
    });
  }, []);

  // Pin click handler
  const handlePinClick = useCallback((slug: string, pin: typeof PINS[0]) => {
    setSelectedSlug(slug);
    setSidebarOpen(true);

    // Dim all other markers
    markerMapRef.current.forEach((marker, s) => {
      marker.setOpacity(s === slug ? 1 : 0.3);
    });

    // Fly to selected pin (shift left to account for sidebar)
    if (googleMapRef.current) {
      const map = googleMapRef.current;
      map.panTo({ lat: pin.lat, lng: pin.lng });
      const currentZoom = map.getZoom() ?? 12;
      if (currentZoom < 13) map.setZoom(13);
    }
  }, []);

  // Close sidebar & restore markers
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedSlug(null);
    markerMapRef.current.forEach((marker) => marker.setOpacity(1));
  }, []);

  // Search filter → fitBounds
  useEffect(() => {
    if (!googleMapRef.current || !mapReady) return;
    const map = googleMapRef.current;
    const q = searchQuery.toLowerCase().trim();

    const filtered = q
      ? PINS.filter((p) => p.name.toLowerCase().includes(q))
      : PINS;

    // Show/hide markers
    markerMapRef.current.forEach((marker, slug) => {
      const visible = filtered.some((p) => p.slug === slug);
      marker.setVisible(visible);
      marker.setOpacity(1);
    });

    if (filtered.length === 0) return;

    if (filtered.length === 1) {
      map.panTo({ lat: filtered[0].lat, lng: filtered[0].lng });
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      filtered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 80, right: sidebarOpen ? 420 : 60, bottom: 60, left: 60 });
    }
  }, [searchQuery, mapReady, sidebarOpen]);

  // Derived data for sidebar
  const selectedPin = PINS.find((p) => p.slug === selectedSlug) ?? null;
  const selectedRank = selectedSlug ? getRank(selectedSlug) : null;
  const selectedMatch = matches.find((m: any) => m.neighborhood?.slug === selectedSlug);
  const selectedNeighbourhood = selectedMatch?.neighborhood;

  return (
    <div className="relative w-full bg-slate-900" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Map container ─────────────────────────────────────── */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* ── Loading overlay ───────────────────────────────────── */}
      {!mapReady && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400 mx-auto" />
            <p className="text-sm text-slate-400">Loading map…</p>
          </div>
        </div>
      )}

      {/* ── Top search bar ────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl px-3 py-2">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neighbourhoods…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Match loading pill ───────────────────────────────── */}
      {createRec.isPending && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-full px-3 py-1.5 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin text-teal-400" />
            Scoring matches…
          </div>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-4 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-3 space-y-2 shadow-xl">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Match Score</p>
          {[
            { color: "#10b981", label: "#1 Best Match" },
            { color: "#f59e0b", label: "Top 10" },
            { color: "#475569", label: "Other neighbourhoods" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2.5 pt-1 border-t border-slate-700/60 mt-1">
            <div className="w-7 h-5 rounded-full bg-slate-900 border border-teal-500 flex items-center justify-center">
              <span className="text-[9px] text-teal-400 font-bold">3</span>
            </div>
            <span className="text-xs text-slate-400">Cluster</span>
          </div>
        </div>
      </div>

      {/* ── Zoom controls ─────────────────────────────────────── */}
      <div className="absolute right-4 bottom-28 z-10 flex flex-col gap-1">
        {[
          { label: "+", delta: 1 },
          { label: "−", delta: -1 },
        ].map(({ label, delta }) => (
          <button
            key={label}
            onClick={() => {
              const map = googleMapRef.current;
              if (map) map.setZoom((map.getZoom() ?? 12) + delta);
            }}
            className="w-9 h-9 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg text-slate-200 text-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            if (googleMapRef.current) {
              googleMapRef.current.panTo(CALGARY_CENTER);
              googleMapRef.current.setZoom(12);
            }
          }}
          className="w-9 h-9 mt-1 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
          title="Reset view"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && selectedPin && (
          <motion.div
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="absolute top-0 right-0 bottom-0 z-20 w-full max-w-[380px] bg-slate-900/98 backdrop-blur-md border-l border-slate-700 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Sidebar header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {selectedRank !== null && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-sm",
                      selectedRank === 1 ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                    )}>
                      #{selectedRank} MATCH
                    </span>
                  )}
                  {selectedRank === 1 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                </div>
                <h2 className="text-xl font-bold text-slate-100 truncate">{selectedPin.name}</h2>
                {selectedNeighbourhood?.identity && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{selectedNeighbourhood.identity}</p>
                )}
              </div>
              <button
                onClick={handleCloseSidebar}
                className="shrink-0 ml-3 mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Compatibility score */}
              {selectedMatch && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className={cn(
                        "text-4xl font-black",
                        selectedRank === 1 ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {selectedMatch.compatibilityScore}%
                      </div>
                      <div className="text-xs text-slate-400">lifestyle match</div>
                    </div>
                    <div className="text-right space-y-1 text-xs text-slate-400">
                      {selectedNeighbourhood?.medianRentalEstimate && (
                        <div className="flex items-center gap-1 justify-end">
                          <MapPin className="h-3 w-3" />
                          ~${selectedNeighbourhood.medianRentalEstimate.toLocaleString()}/mo
                        </div>
                      )}
                      {selectedNeighbourhood?.downtownCommuteEstimateMins && (
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {selectedNeighbourhood.downtownCommuteEstimateMins} min downtown
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", selectedRank === 1 ? "bg-emerald-500" : "bg-amber-500")}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedMatch.compatibilityScore}%` }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                  <span className={cn(
                    "inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full",
                    selectedRank === 1 ? "bg-emerald-900/50 text-emerald-400" : "bg-amber-900/50 text-amber-400"
                  )}>
                    {selectedMatch.fitLabel}
                  </span>
                </div>
              )}

              {/* Scores grid */}
              {selectedNeighbourhood && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Overview</h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SCORE_DIMS.slice(0, 4).map((d) => {
                      const score = selectedNeighbourhood[d.key] as number;
                      return (
                        <div key={d.key} className="text-center p-2 bg-slate-800/60 rounded-lg">
                          <div className={cn(
                            "text-base font-bold tabular-nums",
                            score >= 4 ? "text-emerald-400" : score >= 3 ? "text-teal-400" : "text-amber-400"
                          )}>{score}/5</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {SCORE_DIMS.slice(4).map((d) => {
                      const score = selectedNeighbourhood[d.key] as number;
                      return (
                        <div key={d.key} className="text-center p-2 bg-slate-800/60 rounded-lg">
                          <div className={cn(
                            "text-base font-bold tabular-nums",
                            score >= 4 ? "text-emerald-400" : score >= 3 ? "text-teal-400" : "text-amber-400"
                          )}>{score}/5</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedNeighbourhood?.lifestyleTags?.length > 0 && (
                <div className="px-5 py-3 border-b border-slate-700/60">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNeighbourhood.lifestyleTags.map((tag: string) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded-full border border-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top 5 matches list */}
              {matches.length > 0 && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                    <h3 className="text-xs font-semibold text-slate-200">Your Top 5 Matches</h3>
                  </div>
                  <div className="space-y-1.5">
                    {matches.slice(0, 5).map((m: any, i: number) => {
                      const n = m.neighborhood;
                      const isSelected = n?.slug === selectedSlug;
                      return (
                        <button
                          key={n?.slug}
                          onClick={() => {
                            const pin = PINS.find((p) => p.slug === n?.slug);
                            if (pin) handlePinClick(pin.slug, pin);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all",
                            isSelected
                              ? "bg-teal-900/40 border border-teal-700/60"
                              : "bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/50"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0",
                              i === 0 ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                            )}>
                              #{i + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-200 truncate">{n?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn(
                              "text-xs font-bold",
                              i === 0 ? "text-emerald-400" : "text-amber-400"
                            )}>
                              {m.compatibilityScore}%
                            </span>
                            <ChevronRight className="h-3 w-3 text-slate-500" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No questionnaire CTA */}
              {!loadQuestionnaire() && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="bg-teal-900/20 border border-teal-800/40 rounded-xl p-4 text-center space-y-3">
                    <Sparkles className="h-5 w-5 text-teal-400 mx-auto" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Complete the questionnaire to see personalised match scores for each neighbourhood.
                    </p>
                    <Link href="/questionnaire">
                      <button className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors">
                        Find my fit <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Commute disclaimer */}
              <div className="px-5 py-3">
                <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{COMMUTE_DISCLAIMER}</span>
                </div>
              </div>
            </div>

            {/* Sidebar footer */}
            <div className="px-5 py-4 border-t border-slate-700 bg-slate-900/60 space-y-2">
              <Link href={`/neighborhoods/${selectedSlug}`}>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  View full profile
                </button>
              </Link>
              <div className="flex gap-2">
                <Link href="/results" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <TrendingUp className="h-3.5 w-3.5" />
                    All results
                  </button>
                </Link>
                <Link href={`/compare?slugs=${selectedSlug}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <GitCompare className="h-3.5 w-3.5" />
                    Compare
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
