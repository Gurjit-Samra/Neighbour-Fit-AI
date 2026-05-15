import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const TEAL = "#00cc99";
const SLATE_950 = "#020617";
const SLATE_800 = "#1e293b";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_200 = "#e2e8f0";
const WHITE = "#ffffff";
const AMBER = "#f59e0b";

const styles = StyleSheet.create({
  page: {
    backgroundColor: SLATE_950,
    color: WHITE,
    fontFamily: "Helvetica",
    padding: 0,
  },
  header: {
    backgroundColor: SLATE_800,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TEAL,
  },
  brandName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  headerDate: {
    fontSize: 8,
    color: SLATE_400,
  },
  headerSubtitle: {
    fontSize: 10,
    color: SLATE_400,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  matchCard: {
    backgroundColor: SLATE_800,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  matchCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  matchRankBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    backgroundColor: TEAL,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 4,
  },
  matchRankBadgeOther: {
    backgroundColor: "#334155",
    color: SLATE_200,
  },
  matchName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 2,
  },
  matchIdentity: {
    fontSize: 9,
    color: SLATE_400,
  },
  matchScore: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    textAlign: "right",
  },
  matchScoreOther: {
    color: SLATE_200,
  },
  matchScoreLabel: {
    fontSize: 8,
    color: SLATE_400,
    textAlign: "right",
  },
  fitBadge: {
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    marginBottom: 10,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: TEAL,
  },
  dimensionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  dimItem: {
    width: "30%",
    marginBottom: 4,
  },
  dimLabel: {
    fontSize: 7,
    color: SLATE_400,
    marginBottom: 2,
  },
  dimBarBg: {
    height: 3,
    backgroundColor: "#334155",
    borderRadius: 1.5,
  },
  dimBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: TEAL,
  },
  dimValue: {
    fontSize: 7,
    color: SLATE_200,
    marginTop: 1,
  },
  aiBox: {
    backgroundColor: "#1e293b",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 8,
  },
  aiLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    marginBottom: 4,
  },
  aiText: {
    fontSize: 9,
    color: SLATE_200,
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  infoChip: {
    fontSize: 8,
    color: SLATE_400,
    backgroundColor: "#334155",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disclaimer: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  disclaimerText: {
    fontSize: 7.5,
    color: SLATE_600,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: SLATE_600,
  },
  warningChip: {
    fontSize: 7.5,
    color: AMBER,
    backgroundColor: "#451a03",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
});

function fitBadgeColors(label: string) {
  if (label.startsWith("Excellent")) return { color: "#34d399", borderColor: "#065f46", backgroundColor: "#022c22" };
  if (label.startsWith("Strong"))    return { color: "#2dd4bf", borderColor: "#0d9488", backgroundColor: "#042f2e" };
  if (label.startsWith("Moderate"))  return { color: "#fbbf24", borderColor: "#92400e", backgroundColor: "#1c1300" };
  return { color: "#fb923c", borderColor: "#9a3412", backgroundColor: "#1a0800" };
}

function dimColorHex(dim: string) {
  const map: Record<string, string> = {
    affordability: "#10b981",
    walkability:   "#14b8a6",
    transit:       "#3b82f6",
    nightlife:     "#a855f7",
    safety:        "#06b6d4",
    fitness:       "#ef4444",
    petFriendliness: "#f59e0b",
  };
  return map[dim] ?? "#64748b";
}

function dimLabel(dim: string) {
  const map: Record<string, string> = {
    affordability:   "Affordability",
    walkability:     "Walkability",
    transit:         "Transit",
    nightlife:       "Nightlife",
    safety:          "Safety",
    fitness:         "Fitness",
    petFriendliness: "Pet-Friendly",
  };
  return map[dim] ?? dim;
}

interface Match {
  neighborhood: any;
  compatibilityScore: number;
  fitLabel: string;
  affordabilityWarning?: boolean;
  dimensionBreakdown: Array<{ dimension: string; score: number }>;
  aiSummary?: string;
  aiSummaryError?: boolean;
}

interface Props {
  matches: Match[];
  generatedAt: string;
}

export function ResultsPDFDocument({ matches, generatedAt }: Props) {
  const COMMUTE_DISCLAIMER =
    "Commute estimate assumes a downtown Calgary destination. For other workplaces, use Google Maps.";

  return (
    <Document title="NeighbourFit AI — Neighbourhood Report">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>NeighbourFit AI</Text>
            </View>
            <Text style={styles.headerDate}>{generatedAt}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Calgary Neighbourhood Compatibility Report · {matches.length} match{matches.length !== 1 ? "es" : ""} found
          </Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Your Neighbourhood Matches</Text>

          {matches.map((match, i) => {
            const n = match.neighborhood;
            const isTop = i === 0;
            const fitColors = fitBadgeColors(match.fitLabel ?? "");

            return (
              <View key={n.id ?? i} style={styles.matchCard}>
                {/* Top row */}
                <View style={styles.matchCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.matchRankBadge, !isTop && styles.matchRankBadgeOther]}>
                      #{i + 1}{isTop ? " — Top match" : ""}
                    </Text>
                    <Text style={styles.matchName}>{n.name}</Text>
                    <Text style={styles.matchIdentity}>{n.identity}</Text>
                  </View>
                  <View>
                    <Text style={[styles.matchScore, !isTop && styles.matchScoreOther]}>
                      {match.compatibilityScore}%
                    </Text>
                    <Text style={styles.matchScoreLabel}>lifestyle fit</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${match.compatibilityScore}%`, backgroundColor: isTop ? TEAL : "#475569" }]} />
                </View>

                {/* Fit badge + warning */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View style={[styles.fitBadge, fitColors]}>
                    <Text>{match.fitLabel}</Text>
                  </View>
                  {match.affordabilityWarning && (
                    <Text style={styles.warningChip}>⚠ Rent may exceed budget</Text>
                  )}
                </View>

                {/* Info chips */}
                <View style={styles.infoRow}>
                  {n.medianRentalEstimate && (
                    <Text style={styles.infoChip}>
                      ~${n.medianRentalEstimate.toLocaleString()}/mo median rent
                    </Text>
                  )}
                  {n.downtownCommuteEstimateMins && (
                    <Text style={styles.infoChip}>
                      {n.downtownCommuteEstimateMins} min to downtown
                    </Text>
                  )}
                </View>

                {/* Dimension breakdown */}
                {match.dimensionBreakdown?.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.dimLabel, { marginBottom: 6 }]}>SCORE BREAKDOWN</Text>
                    <View style={styles.dimensionsGrid}>
                      {match.dimensionBreakdown.map((d) => {
                        const pct = Math.round((d.score / 5) * 100);
                        return (
                          <View key={d.dimension} style={styles.dimItem}>
                            <Text style={styles.dimLabel}>{dimLabel(d.dimension)}</Text>
                            <View style={styles.dimBarBg}>
                              <View style={[styles.dimBarFill, { width: `${pct}%`, backgroundColor: dimColorHex(d.dimension) }]} />
                            </View>
                            <Text style={styles.dimValue}>{d.score}/5</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* AI summary */}
                {match.aiSummary && !match.aiSummaryError && (
                  <View style={styles.aiBox}>
                    <Text style={styles.aiLabel}>✦ AI Lifestyle Insight</Text>
                    <Text style={styles.aiText}>{match.aiSummary}</Text>
                    <Text style={[styles.aiText, { color: SLATE_600, marginTop: 4, fontSize: 7.5 }]}>
                      Scores are curated estimates, not AI-generated.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              {COMMUTE_DISCLAIMER}
            </Text>
            <Text style={[styles.disclaimerText, { marginTop: 4 }]}>
              This report is generated by NeighbourFit AI for informational purposes only.
              All scores are curated MVP estimates subject to change. Verify details with local sources before making any housing decisions.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NeighbourFit AI — Calgary Neighbourhood Report</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
