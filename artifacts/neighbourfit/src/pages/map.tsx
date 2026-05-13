import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { AnimatePresence, motion } from "framer-motion";
import { useCreateRecommendation } from "@workspace/api-client-react";
import { loadQuestionnaire, DEFAULT_WEIGHTS } from "@/lib/questionnaire-store";
import { Link } from "wouter";
import {
  Search, X, MapPin, Clock, Star, TrendingUp, ArrowRight,
  GitCompare, Loader2, Navigation, AlertTriangle, ChevronRight,
  Sparkles, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";

const CALGARY_CENTER = { lat: 51.0447, lng: -114.0719 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const NIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",              stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill",      stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke",    stylers: [{ color: "#0f172a" }] },
  { featureType: "administrative",        elementType: "geometry.stroke",      stylers: [{ color: "#1e293b" }] },
  { featureType: "administrative.land_parcel", elementType: "labels",          stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality",    elementType: "labels.text.fill",stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi",                   elementType: "labels",               stylers: [{ visibility: "off" }] },
  { featureType: "poi.park",              elementType: "geometry",             stylers: [{ color: "#0d2318" }] },
  { featureType: "road",                  elementType: "geometry",             stylers: [{ color: "#1e293b" }] },
  { featureType: "road",                  elementType: "labels.text.fill",     stylers: [{ color: "#475569" }] },
  { featureType: "road.arterial",         elementType: "geometry",             stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway",          elementType: "geometry",             stylers: [{ color: "#243b5e" }] },
  { featureType: "road.highway",          elementType: "geometry.stroke",      stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway",          elementType: "labels.text.fill",     stylers: [{ color: "#64748b" }] },
  { featureType: "road.local",            elementType: "labels",               stylers: [{ visibility: "off" }] },
  { featureType: "transit",               elementType: "labels.icon",          stylers: [{ visibility: "off" }] },
  { featureType: "transit.line",          elementType: "geometry",             stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station",       elementType: "geometry",             stylers: [{ color: "#1e293b" }] },
  { featureType: "water",                 elementType: "geometry",             stylers: [{ color: "#0a1628" }] },
  { featureType: "water",                 elementType: "labels.text.fill",     stylers: [{ color: "#1e293b" }] },
];

const PINS = [
  { slug: "beltline",            name: "Beltline",            lat: 51.0386, lng: -114.0719 },
  { slug: "kensington",          name: "Kensington",          lat: 51.0535, lng: -114.0856 },
  { slug: "mission",             name: "Mission",             lat: 51.0314, lng: -114.0808 },
  { slug: "inglewood",           name: "Inglewood",           lat: 51.0403, lng: -114.0383 },
  { slug: "bridgeland",          name: "Bridgeland",          lat: 51.0597, lng: -114.0583 },
  { slug: "east-village",        name: "East Village",        lat: 51.0450, lng: -114.0550 },
  { slug: "marda-loop",          name: "Marda Loop",          lat: 51.0280, lng: -114.0950 },
  { slug: "sunnyside",           name: "Sunnyside",           lat: 51.0542, lng: -114.0828 },
  { slug: "university-district", name: "University District", lat: 51.0745, lng: -114.1280 },
  { slug: "seton",               name: "Seton",               lat: 50.9615, lng: -113.9980 },
];

function pinFillColor(rank: number | null): string {
  if (rank === 1)                 return "#10b981";
  if (rank !== null && rank <= 5) return "#f59e0b";
  if (rank !== null)              return "#6366f1";
  return "#475569";
}

function pinStrokeColor(rank: number | null): string {
  if (rank === 1)                 return "#059669";
  if (rank !== null && rank <= 5) return "#d97706";
  if (rank !== null)              return "#4338ca";
  return "#334155";
}


function makePinIcon(rank: number | null): google.maps.Symbol {
  return {
    path: "M 12 0 C 5.373 0 0 5.373 0 12 C 0 20 12 32 12 32 C 12 32 24 20 24 12 C 24 5.373 18.627 0 12 0 Z",
    fillColor: pinFillColor(rank),
    fillOpacity: 1,
    strokeColor: pinStrokeColor(rank),
    strokeWeight: 2,
    scale: 1.5,
    anchor: new google.maps.Point(12, 32),
    labelOrigin: new google.maps.Point(12, 11),
  };
}

function makeClusterIcon(count: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#0f172a",
    fillOpacity: 0.97,
    strokeColor: "#14b8a6",
    strokeWeight: 2.5,
    scale: 20,
    labelOrigin: new google.maps.Point(0, 0),
  };
}

const SCORE_DIMS = [
  { key: "affordabilityScore",   label: "Affordability" },
  { key: "walkabilityScore",     label: "Walkability"   },
  { key: "transitScore",         label: "Transit"       },
  { key: "nightlifeScore",       label: "Nightlife"     },
  { key: "safetyScore",          label: "Safety"        },
  { key: "fitnessScore",         label: "Fitness"       },
  { key: "petFriendlinessScore", label: "Pets"          },
] as const;

// ── API Key missing screen ────────────────────────────────────────────────────
function ApiKeyMissing() {
  return (
    <div className="h-[calc(100vh-56px)] bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
        <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto">
          <MapPin className="h-7 w-7 text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Google Maps API Key Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Add your Maps JavaScript API key as <code className="bg-slate-700 px-1 rounded text-teal-300 font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code> in Replit Secrets.
          </p>
        </div>
        <Link href="/"><button className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors">Back to Home</button></Link>
      </div>
    </div>
  );
}

// ── Main Map Page ─────────────────────────────────────────────────────────────
export default function MapPage() {
  if (!API_KEY) return <ApiKeyMissing />;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef    = useRef<google.maps.Map | null>(null);
  // Store classic Markers (still officially supported; no Map ID required)
  const markerMapRef    = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef    = useRef<MarkerClusterer | null>(null);

  const [mapReady,     setMapReady]     = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [matches,      setMatches]      = useState<any[]>([]);

  const createRec = useCreateRecommendation();

  // ── Fetch match scores on mount ───────────────────────────────────────────
  useEffect(() => {
    const q = loadQuestionnaire();
    createRec.mutate({
      data: {
        budget: q?.budget ?? 1800,
        weights: q?.weights ?? DEFAULT_WEIGHTS,
        workplaceNeighborhood: q?.workplaceNeighborhood ?? undefined,
        usedDefaultWeights: !q,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (createRec.data?.matches) setMatches(createRec.data.matches as any[]);
  }, [createRec.data]);

  // Rank among the pinned neighbourhoods only (not all 190+)
  const pinRankMap = useMemo<Map<string, number>>(() => {
    if (!matches.length) return new Map();
    const pinSlugs = new Set(PINS.map((p) => p.slug));
    const pinMatches = matches.filter((m: any) => pinSlugs.has(m.neighborhood?.slug));
    const ranked = new Map<string, number>();
    pinMatches.forEach((m: any, i: number) => {
      ranked.set(m.neighborhood.slug, i + 1);
    });
    return ranked;
  }, [matches]);

  const getRank = useCallback(
    (slug: string): number | null => pinRankMap.get(slug) ?? null,
    [pinRankMap]
  );

  // ── Pin click (defined early — used in marker effect below) ──────────────
  const handlePinClick = useCallback((slug: string, pin: typeof PINS[0]) => {
    setSelectedSlug(slug);
    setSidebarOpen(true);
    markerMapRef.current.forEach((marker, s) => {
      marker.setOpacity(s === slug ? 1 : 0.28);
      marker.setZIndex(s === slug ? 1500 : 100);
    });
    const map = googleMapRef.current;
    if (map) {
      map.panTo({ lat: pin.lat, lng: pin.lng });
      if ((map.getZoom() ?? 12) < 13) map.setZoom(13);
    }
  }, []);

  // ── Close sidebar ─────────────────────────────────────────────────────────
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedSlug(null);
    markerMapRef.current.forEach((marker) => marker.setOpacity(1));
  }, []);

  // Stable ref so marker event listeners always call latest version
  const handlePinClickRef = useRef(handlePinClick);
  useEffect(() => { handlePinClickRef.current = handlePinClick; }, [handlePinClick]);

  // ── Init map ──────────────────────────────────────────────────────────────
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
        gestureHandling: "greedy",
        backgroundColor: "#0f172a",
      });
      googleMapRef.current = map;
      setMapReady(true);
    });
  }, []);

  // ── Build / rebuild markers when map or scores change ─────────────────────
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    const map = googleMapRef.current;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markerMapRef.current.forEach((m) => m.setMap(null));
    markerMapRef.current.clear();

    const allMarkers: google.maps.Marker[] = [];

    PINS.forEach((pin) => {
      const rank = pinRankMap.get(pin.slug) ?? null;
      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        icon: makePinIcon(rank),
        label: rank !== null ? {
          text: String(rank),
          color: "#ffffff",
          fontSize: String(rank).length > 1 ? "9px" : "11px",
          fontWeight: "900",
          fontFamily: "Arial, sans-serif",
        } : undefined,
        title: pin.name,
        optimized: false,
        zIndex: rank === 1 ? 1000 : rank !== null ? 500 : 100,
      });
      marker.addListener("click", () => handlePinClickRef.current(pin.slug, pin));
      markerMapRef.current.set(pin.slug, marker);
      allMarkers.push(marker);
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers: allMarkers,
      algorithm: new SuperClusterAlgorithm({ radius: 80, minZoom: 0, maxZoom: 10 }),
      renderer: {
        render({ count, position }) {
          const label = count > 99 ? "99+" : String(count);
          return new google.maps.Marker({
            position,
            icon: makeClusterIcon(count),
            label: {
              text: label,
              color: "#14b8a6",
              fontSize: count > 9 ? "10px" : "12px",
              fontWeight: "800",
              fontFamily: "Arial, sans-serif",
            },
            title: `${count} neighbourhoods`,
            zIndex: 2000,
            optimized: false,
          });
        },
      },
    });
  }, [mapReady, pinRankMap]);

  // ── Search / filter → fitBounds ───────────────────────────────────────────
  useEffect(() => {
    if (!googleMapRef.current || !mapReady) return;
    const map = googleMapRef.current;
    const q   = searchQuery.toLowerCase().trim();
    const filtered = q ? PINS.filter((p) => p.name.toLowerCase().includes(q)) : PINS;

    markerMapRef.current.forEach((marker, slug) => {
      const show = filtered.some((p) => p.slug === slug);
      marker.setVisible(show);
      marker.setOpacity(1);
    });

    if (!q || filtered.length === 0) return;

    if (filtered.length === 1) {
      map.panTo({ lat: filtered[0].lat, lng: filtered[0].lng });
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      filtered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 80, right: sidebarOpen ? 420 : 80, bottom: 80, left: 80 });
    }
  }, [searchQuery, mapReady, sidebarOpen]);

  // ── Sidebar derived data ──────────────────────────────────────────────────
  const selectedPin           = PINS.find((p) => p.slug === selectedSlug) ?? null;
  const selectedRank          = selectedSlug ? getRank(selectedSlug) : null;
  const selectedMatch         = matches.find((m: any) => m.neighborhood?.slug === selectedSlug);
  const selectedNeighbourhood = selectedMatch?.neighborhood;

  return (
    <div className="relative w-full bg-slate-900" style={{ height: "calc(100vh - 56px)" }}>

      {/* Map canvas */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      )}

      {/* Search bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
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

      {/* Scoring pill */}
      {createRec.isPending && (
        <div className="absolute top-[72px] left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-full px-3 py-1.5 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin text-teal-400" />
            Scoring matches…
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 left-4 z-10">
        <div className="bg-slate-900/92 backdrop-blur-md border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Match Score</p>
          {[
            { color: "#10b981", label: "#1 Best Match" },
            { color: "#f59e0b", label: "Top 5" },
            { color: "#6366f1", label: "Ranked 6–10" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2.5 mb-1.5 last:mb-0">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60 mt-1">
            <div className="w-7 h-5 rounded-full bg-slate-900 border border-teal-500 flex items-center justify-center">
              <span className="text-[9px] text-teal-400 font-bold">3</span>
            </div>
            <span className="text-xs text-slate-400">Cluster (zoom to expand)</span>
          </div>
        </div>
      </div>

      {/* Zoom + reset */}
      <div className="absolute right-4 bottom-28 z-10 flex flex-col gap-1.5">
        {[{ label: "+", delta: 1 }, { label: "−", delta: -1 }].map(({ label, delta }) => (
          <button
            key={label}
            onClick={() => { const m = googleMapRef.current; if (m) m.setZoom((m.getZoom() ?? 12) + delta); }}
            className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-slate-600 rounded-lg text-slate-200 text-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
          >{label}</button>
        ))}
        <button
          onClick={() => { const m = googleMapRef.current; if (m) { m.panTo(CALGARY_CENTER); m.setZoom(12); } }}
          className="w-10 h-10 mt-0.5 bg-slate-900/90 backdrop-blur-md border border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center shadow-lg"
          title="Reset view"
        ><Navigation className="h-4 w-4" /></button>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && selectedPin && (
          <motion.div
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 38 }}
            className="absolute top-0 right-0 bottom-0 z-20 w-full max-w-[380px] bg-slate-900/98 backdrop-blur-md border-l border-slate-700 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Sidebar header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {selectedRank !== null && (
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded",
                      selectedRank === 1 ? "bg-emerald-600 text-white"
                      : selectedRank <= 5 ? "bg-amber-600 text-white"
                      : "bg-indigo-600 text-white")}>
                      #{selectedRank} MATCH
                    </span>
                  )}
                  {selectedRank === 1 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                </div>
                <h2 className="text-xl font-bold text-slate-100 truncate">{selectedPin.name}</h2>
                {selectedNeighbourhood?.identity && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-2">{selectedNeighbourhood.identity}</p>
                )}
              </div>
              <button
                onClick={handleCloseSidebar}
                className="shrink-0 ml-3 mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              ><X className="h-4 w-4" /></button>
            </div>

            {/* Sidebar body */}
            <div className="flex-1 overflow-y-auto">

              {/* Compatibility score */}
              {selectedMatch && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <div className={cn("text-4xl font-black leading-none",
                        selectedRank === 1 ? "text-emerald-400" : selectedRank !== null && selectedRank <= 5 ? "text-amber-400" : "text-indigo-400")}>
                        {selectedMatch.compatibilityScore}%
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">lifestyle match</div>
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
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full",
                        selectedRank === 1 ? "bg-emerald-500" : selectedRank !== null && selectedRank <= 5 ? "bg-amber-500" : "bg-indigo-500")}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedMatch.compatibilityScore}%` }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                  <span className={cn("inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full",
                    selectedRank === 1 ? "bg-emerald-900/50 text-emerald-400"
                    : selectedRank !== null && selectedRank <= 5 ? "bg-amber-900/50 text-amber-400"
                    : "bg-indigo-900/50 text-indigo-400")}>
                    {selectedMatch.fitLabel}
                  </span>
                </div>
              )}

              {/* Score grid */}
              {selectedNeighbourhood && (
                <div className="px-5 py-4 border-b border-slate-700/60">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Breakdown</h3>
                  <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                    {SCORE_DIMS.slice(0, 4).map((d) => {
                      const score = selectedNeighbourhood[d.key] as number;
                      return (
                        <div key={d.key} className="text-center p-2 bg-slate-800/60 rounded-lg">
                          <div className={cn("text-sm font-bold tabular-nums",
                            score >= 4 ? "text-emerald-400" : score >= 3 ? "text-teal-400" : "text-amber-400")}>
                            {score}/5
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SCORE_DIMS.slice(4).map((d) => {
                      const score = selectedNeighbourhood[d.key] as number;
                      return (
                        <div key={d.key} className="text-center p-2 bg-slate-800/60 rounded-lg">
                          <div className={cn("text-sm font-bold tabular-nums",
                            score >= 4 ? "text-emerald-400" : score >= 3 ? "text-teal-400" : "text-amber-400")}>
                            {score}/5
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lifestyle tags */}
              {selectedNeighbourhood?.lifestyleTags?.length > 0 && (
                <div className="px-5 py-3 border-b border-slate-700/60 flex flex-wrap gap-1.5">
                  {selectedNeighbourhood.lifestyleTags.map((tag: string) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded-full border border-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Top 5 matches */}
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
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0",
                              i === 0 ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                              #{i + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-200 truncate">{n?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn("text-xs font-bold",
                              i === 0 ? "text-emerald-400" : "text-amber-400")}>
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

              {/* Questionnaire CTA */}
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
                  <ExternalLink className="h-4 w-4" /> View full profile
                </button>
              </Link>
              <div className="flex gap-2">
                <Link href="/results" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <TrendingUp className="h-3.5 w-3.5" /> All results
                  </button>
                </Link>
                <Link href={`/compare?slugs=${selectedSlug}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <GitCompare className="h-3.5 w-3.5" /> Compare
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
