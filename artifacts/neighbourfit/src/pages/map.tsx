import {
  useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { AnimatePresence, motion } from "framer-motion";
import { useCreateRecommendation } from "@workspace/api-client-react";
import { loadQuestionnaire, DEFAULT_WEIGHTS } from "@/lib/questionnaire-store";
import { Link } from "wouter";
import {
  Search, X, MapPin, Clock, Star, TrendingUp, ArrowRight,
  GitCompare, Loader2, Navigation, AlertTriangle, Sparkles,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMUTE_DISCLAIMER } from "@/lib/utils";

const CALGARY_CENTER = { lat: 51.0447, lng: -114.0719 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const NIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",                                                     stylers: [{ color: "#0b1120" }] },
  { elementType: "labels.text.fill",                                             stylers: [{ color: "#4a5568" }] },
  { elementType: "labels.text.stroke",                                           stylers: [{ color: "#0b1120" }] },
  { featureType: "administrative",        elementType: "geometry.stroke",        stylers: [{ color: "#1a2336" }] },
  { featureType: "administrative.land_parcel",elementType: "labels",             stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality",   elementType: "labels.text.fill",   stylers: [{ color: "#7a8ba0" }] },
  { featureType: "poi",                   elementType: "labels",                 stylers: [{ visibility: "off" }] },
  { featureType: "poi.park",              elementType: "geometry",               stylers: [{ color: "#091c12" }] },
  { featureType: "road",                  elementType: "geometry",               stylers: [{ color: "#16202e" }] },
  { featureType: "road",                  elementType: "labels.text.fill",       stylers: [{ color: "#3a4a5e" }] },
  { featureType: "road.arterial",         elementType: "geometry",               stylers: [{ color: "#162436" }] },
  { featureType: "road.highway",          elementType: "geometry",               stylers: [{ color: "#1a2f4a" }] },
  { featureType: "road.highway",          elementType: "geometry.stroke",        stylers: [{ color: "#12192a" }] },
  { featureType: "road.highway",          elementType: "labels.text.fill",       stylers: [{ color: "#4a6080" }] },
  { featureType: "road.local",            elementType: "labels",                 stylers: [{ visibility: "off" }] },
  { featureType: "transit",               elementType: "labels.icon",            stylers: [{ visibility: "off" }] },
  { featureType: "transit.line",          elementType: "geometry",               stylers: [{ color: "#141f30" }] },
  { featureType: "transit.station",       elementType: "geometry",               stylers: [{ color: "#141f30" }] },
  { featureType: "water",                 elementType: "geometry",               stylers: [{ color: "#070e1a" }] },
  { featureType: "water",                 elementType: "labels.text.fill",       stylers: [{ color: "#141f30" }] },
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

const SCORE_DIMS = [
  { key: "affordabilityScore",   label: "Afford."   },
  { key: "walkabilityScore",     label: "Walk"      },
  { key: "transitScore",         label: "Transit"   },
  { key: "nightlifeScore",       label: "Nightlife" },
  { key: "safetyScore",          label: "Safety"    },
  { key: "fitnessScore",         label: "Fitness"   },
  { key: "petFriendlinessScore", label: "Pets"      },
] as const;

function rankColor(rank: number): string {
  if (rank === 1)  return "#10b981";
  if (rank <= 5)   return "#f59e0b";
  return "#6366f1";
}
function rankBg(rank: number): string {
  if (rank === 1)  return "bg-emerald-600";
  if (rank <= 5)   return "bg-amber-600";
  return "bg-indigo-600";
}
function rankText(rank: number): string {
  if (rank === 1)  return "text-emerald-400";
  if (rank <= 5)   return "text-amber-400";
  return "text-indigo-400";
}
function rankBar(rank: number): string {
  if (rank === 1)  return "bg-emerald-500";
  if (rank <= 5)   return "bg-amber-500";
  return "bg-indigo-500";
}

function makePinIcon(rank: number | null, selected: boolean): google.maps.Symbol {
  const color = rank !== null ? rankColor(rank) : "#334155";
  return {
    path: "M 12 0 C 5.373 0 0 5.373 0 12 C 0 20 12 32 12 32 C 12 32 24 20 24 12 C 24 5.373 18.627 0 12 0 Z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: selected ? "#ffffff" : (rank !== null ? color : "#1e293b"),
    strokeWeight: selected ? 3 : 1.5,
    scale: selected ? 1.8 : 1.4,
    anchor: new google.maps.Point(12, 32),
    labelOrigin: new google.maps.Point(12, 11),
  };
}

function ApiKeyMissing() {
  return (
    <div className="h-[calc(100vh-56px)] bg-[#0b1120] flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-[#111827]/80 border border-white/8 rounded-2xl p-8 text-center space-y-5 backdrop-blur-xl">
        <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <MapPin className="h-7 w-7 text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Google Maps API Key Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Add your Maps JavaScript API key as{" "}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-teal-300 font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code>{" "}
            in Replit Secrets.
          </p>
        </div>
        <Link href="/">
          <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function MapPage() {
  if (!API_KEY) return <ApiKeyMissing />;
  return <MapPageInner />;
}

function MapPageInner() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef    = useRef<google.maps.Map | null>(null);
  const markerMapRef    = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef    = useRef<MarkerClusterer | null>(null);
  const searchTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapReady,       setMapReady]       = useState(false);
  const [selectedSlug,   setSelectedSlug]   = useState<string | null>(null);
  const [matches,        setMatches]        = useState<any[]>([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const createRec = useCreateRecommendation();

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

  const pinRankMap = useMemo<Map<string, number>>(() => {
    if (!matches.length) return new Map();
    const pinSlugs = new Set(PINS.map((p) => p.slug));
    const pinMatches = matches.filter((m: any) => pinSlugs.has(m.neighborhood?.slug));
    const ranked = new Map<string, number>();
    pinMatches.forEach((m: any, i: number) => ranked.set(m.neighborhood.slug, i + 1));
    return ranked;
  }, [matches]);

  const top5 = useMemo(() => {
    if (!matches.length) return [];
    const pinSlugs = new Set(PINS.map((p) => p.slug));
    return matches.filter((m: any) => pinSlugs.has(m.neighborhood?.slug)).slice(0, 5);
  }, [matches]);

  // ── Search debounce ──────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedQuery(value), 400);
  }, []);

  // ── Highlight / deselect helpers ─────────────────────────────────────────
  const applyMarkerHighlight = useCallback((slug: string | null) => {
    markerMapRef.current.forEach((marker, s) => {
      const rank = pinRankMap.get(s) ?? null;
      const isSel = s === slug;
      marker.setOpacity(slug === null ? 1 : isSel ? 1 : 0.28);
      marker.setZIndex(isSel ? 1500 : rank === 1 ? 1000 : rank !== null ? 500 : 100);
      marker.setIcon(makePinIcon(rank, isSel));
    });
  }, [pinRankMap]);

  // ── Pin click ─────────────────────────────────────────────────────────────
  const handlePinClick = useCallback((slug: string, pin: typeof PINS[0]) => {
    setSelectedSlug(slug);
    applyMarkerHighlight(slug);
    const map = googleMapRef.current;
    if (map) {
      map.panTo({ lat: pin.lat, lng: pin.lng });
    }
  }, [applyMarkerHighlight]);

  const handleDeselect = useCallback(() => {
    setSelectedSlug(null);
    applyMarkerHighlight(null);
  }, [applyMarkerHighlight]);

  const handlePinClickRef = useRef(handlePinClick);
  const handleDeselectRef  = useRef(handleDeselect);
  useEffect(() => { handlePinClickRef.current = handlePinClick; }, [handlePinClick]);
  useEffect(() => { handleDeselectRef.current = handleDeselect; }, [handleDeselect]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || !API_KEY) return;
    setOptions({ key: API_KEY, v: "weekly" });
    importLibrary("maps").then(() => {
      if (!mapContainerRef.current) return;
      const map = new google.maps.Map(mapContainerRef.current, {
        center: CALGARY_CENTER,
        zoom: 11,
        styles: NIGHT_STYLE,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        backgroundColor: "#0b1120",
      });
      // Fit all pins into view with sidebar padding
      const bounds = new google.maps.LatLngBounds();
      PINS.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 80, right: 380, bottom: 80, left: 60 });

      // Click on map background to deselect
      map.addListener("click", () => handleDeselectRef.current());

      googleMapRef.current = map;
      setMapReady(true);
    });
  }, []);

  // ── Build markers when map or scores change ───────────────────────────────
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    const map = googleMapRef.current;

    if (clustererRef.current) { clustererRef.current.clearMarkers(); clustererRef.current = null; }
    markerMapRef.current.forEach((m) => m.setMap(null));
    markerMapRef.current.clear();

    const allMarkers: google.maps.Marker[] = [];

    PINS.forEach((pin) => {
      const rank = pinRankMap.get(pin.slug) ?? null;
      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        icon: makePinIcon(rank, false),
        label: rank !== null ? {
          text: String(rank),
          color: "#ffffff",
          fontSize: String(rank).length > 1 ? "9px" : "11px",
          fontWeight: "900",
          fontFamily: "Inter, Arial, sans-serif",
        } : undefined,
        title: pin.name,
        optimized: false,
        zIndex: rank === 1 ? 1000 : rank !== null ? 500 : 100,
      });
      marker.addListener("click", (e: google.maps.MapMouseEvent) => {
        e.stop?.();
        handlePinClickRef.current(pin.slug, pin);
      });
      markerMapRef.current.set(pin.slug, marker);
      allMarkers.push(marker);
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers: allMarkers,
      algorithm: new SuperClusterAlgorithm({ radius: 80, minZoom: 0, maxZoom: 10 }),
      renderer: {
        render({ count, position }) {
          return new google.maps.Marker({
            position,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#0b1120",
              fillOpacity: 0.95,
              strokeColor: "#14b8a6",
              strokeWeight: 2,
              scale: 18,
              labelOrigin: new google.maps.Point(0, 0),
            },
            label: {
              text: count > 99 ? "99+" : String(count),
              color: "#14b8a6",
              fontSize: "10px",
              fontWeight: "700",
              fontFamily: "Inter, Arial, sans-serif",
            },
            title: `${count} neighbourhoods`,
            zIndex: 2000,
            optimized: false,
          });
        },
      },
    });
  }, [mapReady, pinRankMap]);

  // Re-apply highlight when pinRankMap updates (markers rebuilt)
  useEffect(() => {
    if (selectedSlug) applyMarkerHighlight(selectedSlug);
  }, [pinRankMap, selectedSlug, applyMarkerHighlight]);

  // ── Debounced search → filter markers + fitBounds ─────────────────────────
  useEffect(() => {
    if (!googleMapRef.current || !mapReady) return;
    const map = googleMapRef.current;
    const q = debouncedQuery.toLowerCase().trim();
    const filtered = q ? PINS.filter((p) => p.name.toLowerCase().includes(q)) : PINS;

    markerMapRef.current.forEach((marker, slug) => {
      marker.setVisible(filtered.some((p) => p.slug === slug));
    });

    if (!q) return;

    if (filtered.length === 1) {
      map.panTo({ lat: filtered[0].lat, lng: filtered[0].lng });
      if ((map.getZoom() ?? 11) < 13) map.setZoom(13);
    } else if (filtered.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      filtered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 80, right: 380, bottom: 80, left: 60 });
    }
  }, [debouncedQuery, mapReady]);

  // ── Derived sidebar data ──────────────────────────────────────────────────
  const selectedPin           = PINS.find((p) => p.slug === selectedSlug) ?? null;
  const selectedRank          = selectedSlug ? (pinRankMap.get(selectedSlug) ?? null) : null;
  const selectedMatch         = matches.find((m: any) => m.neighborhood?.slug === selectedSlug);
  const selectedNeighbourhood = selectedMatch?.neighborhood;
  const hasQuestionnaire      = !!loadQuestionnaire();

  return (
    <div className="relative w-full bg-[#0b1120]" style={{ height: "calc(100vh - 56px)" }}>

      {/* Map canvas — full bleed */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#0b1120] flex items-center justify-center z-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-[calc(50%+180px)] w-72 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#0d1525]/90 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl px-3.5 py-2.5">
          <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search neighbourhoods…"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => { handleSearchChange(""); }} className="text-slate-600 hover:text-slate-400 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scoring indicator */}
      {createRec.isPending && (
        <div className="absolute top-[72px] left-1/2 -translate-x-[calc(50%+180px)] z-10">
          <div className="flex items-center gap-2 bg-[#0d1525]/90 backdrop-blur-xl border border-white/8 rounded-full px-3 py-1.5 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin text-teal-400" />
            Scoring…
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="absolute bottom-6 left-4 z-10">
        <div className="bg-[#0d1525]/90 backdrop-blur-xl border border-white/8 rounded-xl px-3.5 py-3 shadow-xl">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Your match</p>
          {[
            { color: "#10b981", label: "#1 Best match" },
            { color: "#f59e0b", label: "Top 5" },
            { color: "#6366f1", label: "Ranked 6–10" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zoom / reset ── */}
      <div className="absolute right-[372px] bottom-6 z-10 flex flex-col gap-1">
        {[{ label: "+", delta: 1 }, { label: "−", delta: -1 }].map(({ label, delta }) => (
          <button
            key={label}
            onClick={() => { const m = googleMapRef.current; if (m) m.setZoom((m.getZoom() ?? 11) + delta); }}
            className="w-9 h-9 bg-[#0d1525]/90 backdrop-blur-xl border border-white/8 rounded-xl text-slate-300 text-base font-semibold hover:bg-slate-800/70 transition-colors flex items-center justify-center shadow-lg"
          >{label}</button>
        ))}
        <button
          onClick={() => {
            const m = googleMapRef.current;
            if (!m) return;
            const bounds = new google.maps.LatLngBounds();
            PINS.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
            m.fitBounds(bounds, { top: 80, right: 380, bottom: 80, left: 60 });
          }}
          className="w-9 h-9 mt-0.5 bg-[#0d1525]/90 backdrop-blur-xl border border-white/8 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/70 transition-colors flex items-center justify-center shadow-lg"
          title="Fit all"
        ><Navigation className="h-3.5 w-3.5" /></button>
      </div>

      {/* ── Sidebar — always present ─────────────────────────────────────── */}
      <div className="absolute top-0 right-0 bottom-0 z-20 w-[360px] bg-[#0a0f1e]/88 backdrop-blur-2xl border-l border-white/6 flex flex-col overflow-hidden shadow-[−4px_0_40px_rgba(0,0,0,0.6)]">

        {/* Sidebar header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/6">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Community Top 5</h2>
            </div>
            {createRec.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {hasQuestionnaire ? "Ranked by your lifestyle priorities" : "Based on default preferences"}
          </p>
        </div>

        {/* Top 5 rows */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="py-2 px-3 space-y-1">
            {top5.length === 0 && !createRec.isPending && (
              <div className="text-center py-8 text-xs text-slate-500">
                {hasQuestionnaire ? "No results yet" : ""}
              </div>
            )}

            {top5.map((m: any, i: number) => {
              const n        = m.neighborhood;
              const rank     = i + 1;
              const isSel    = n?.slug === selectedSlug;
              const pin      = PINS.find((p) => p.slug === n?.slug);

              return (
                <div key={n?.slug}>
                  <button
                    onClick={() => pin ? handlePinClick(pin.slug, pin) : undefined}
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-3 transition-all duration-200 group",
                      isSel
                        ? "bg-white/7 border border-white/12"
                        : "hover:bg-white/4 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={cn(
                        "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shadow-sm",
                        rankBg(rank)
                      )}>
                        {rank}
                      </div>

                      {/* Name + identity */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-slate-100 truncate">{n?.name}</span>
                          {rank === 1 && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                        </div>
                        {n?.identity && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-snug">{n.identity}</p>
                        )}
                      </div>

                      {/* Score + chevron */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className={cn("text-sm font-bold tabular-nums", rankText(rank))}>
                          {m.compatibilityScore}%
                        </span>
                        {isSel
                          ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                          : <ChevronDown className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-500 transition-colors" />
                        }
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-2.5 h-0.5 rounded-full bg-white/6 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", rankBar(rank))}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.compatibilityScore}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.06 }}
                      />
                    </div>
                  </button>

                  {/* Expanded detail panel for selected row */}
                  <AnimatePresence initial={false}>
                    {isSel && selectedNeighbourhood && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mx-1 mb-1 bg-white/4 border border-white/8 rounded-xl p-3 space-y-3">

                          {/* Meta row */}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            {selectedNeighbourhood.medianRentalEstimate && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5" />
                                ~${selectedNeighbourhood.medianRentalEstimate.toLocaleString()}/mo
                              </span>
                            )}
                            {selectedNeighbourhood.downtownCommuteEstimateMins && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {selectedNeighbourhood.downtownCommuteEstimateMins} min downtown
                              </span>
                            )}
                            <span className={cn("ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold",
                              rank === 1 ? "bg-emerald-900/60 text-emerald-400"
                              : "bg-amber-900/60 text-amber-400")}>
                              {selectedMatch.fitLabel}
                            </span>
                          </div>

                          {/* Score grid */}
                          <div className="grid grid-cols-4 gap-1">
                            {SCORE_DIMS.slice(0, 4).map((d) => {
                              const score = selectedNeighbourhood[d.key] as number;
                              return (
                                <div key={d.key} className="text-center bg-white/4 rounded-lg py-1.5">
                                  <div className={cn("text-xs font-bold tabular-nums",
                                    score >= 4 ? "text-emerald-400" : score >= 3 ? "text-teal-400" : "text-amber-400")}>
                                    {score}/5
                                  </div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">{d.label}</div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tags */}
                          {selectedNeighbourhood.lifestyleTags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {selectedNeighbourhood.lifestyleTags.slice(0, 4).map((tag: string) => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded-full border border-white/8">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-1.5 pt-0.5">
                            <Link href={`/neighborhoods/${selectedSlug}`} className="flex-1">
                              <button className="w-full flex items-center justify-center gap-1 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold rounded-lg transition-colors">
                                <ExternalLink className="h-3 w-3" /> Full profile
                              </button>
                            </Link>
                            <Link href={`/compare?slugs=${selectedSlug}`} className="flex-1">
                              <button className="w-full flex items-center justify-center gap-1 py-1.5 bg-white/7 hover:bg-white/10 text-slate-300 text-[11px] font-medium rounded-lg border border-white/8 transition-colors">
                                <GitCompare className="h-3 w-3" /> Compare
                              </button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Placeholder rows when scoring */}
            {top5.length === 0 && createRec.isPending && (
              [...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl px-3 py-3 border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-white/5 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded bg-white/5 animate-pulse w-3/4" />
                      <div className="h-2 rounded bg-white/4 animate-pulse w-1/2" />
                    </div>
                    <div className="h-4 w-8 rounded bg-white/5 animate-pulse" />
                  </div>
                  <div className="mt-2.5 h-0.5 rounded-full bg-white/5" />
                </div>
              ))
            )}
          </div>

          {/* Questionnaire CTA */}
          {!hasQuestionnaire && (
            <div className="px-4 py-3 mx-3 mb-3 bg-teal-900/20 border border-teal-800/30 rounded-xl text-center space-y-2.5">
              <Sparkles className="h-4 w-4 text-teal-400 mx-auto" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Answer a few questions to see your personalised neighbourhood ranking.
              </p>
              <Link href="/questionnaire">
                <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors">
                  Find my fit <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          )}

          {/* All results link */}
          {hasQuestionnaire && (
            <div className="px-4 pb-4">
              <Link href="/results">
                <button className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/4">
                  <TrendingUp className="h-3 w-3" /> View full results
                </button>
              </Link>
            </div>
          )}

          {/* Commute disclaimer */}
          <div className="px-4 pb-4">
            <div className="flex items-start gap-1.5 text-[9px] text-slate-600 leading-relaxed">
              <AlertTriangle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
              <span>{COMMUTE_DISCLAIMER}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
