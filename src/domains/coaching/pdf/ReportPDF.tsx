import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#1a1d27",
  accent: "#c9a227",
  text: "#e8e8e8",
  muted: "#8a8fa8",
  success: "#4caf82",
  danger: "#e05c5c",
  warning: "#e09f3e",
  border: "#2a2d3a",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 40,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 10,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.accent },
  headerRight: { alignItems: "flex-end" },
  headerLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  headerValue: { fontSize: 10, color: C.text },
  // Section
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  // Cards / boxes
  card: {
    backgroundColor: C.surface,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  // Text
  body: { fontSize: 10, color: C.text, lineHeight: 1.5 },
  muted: { fontSize: 9, color: C.muted },
  italic: { fontSize: 9, color: C.muted, fontFamily: "Helvetica-Oblique" },
  bold: { fontFamily: "Helvetica-Bold" },
  // Rank potential banner
  rankBanner: {
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accent,
    padding: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  rankLabel: { fontSize: 8, color: C.accent, textTransform: "uppercase", letterSpacing: 1.2 },
  rankValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.accent, marginTop: 4 },
  rankSub: { fontSize: 8, color: C.muted, marginTop: 4 },
  // Action item
  actionRow: { flexDirection: "row", marginBottom: 10, gap: 8 },
  actionNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionNumText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.bg },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text },
  actionMeta: { fontSize: 8, color: C.muted, marginTop: 2 },
  // Strength/weakness row
  itemRow: { marginBottom: 10 },
  itemTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text },
  itemDesc: { fontSize: 9, color: C.muted, marginTop: 2 },
  itemEvidence: { fontSize: 8, color: C.muted, fontFamily: "Helvetica-Oblique", marginTop: 2 },
  // Badge
  badgeRow: { flexDirection: "row", gap: 4, marginBottom: 2 },
  badge: { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  // Champion rec
  champRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  champName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text },
  champReason: { fontSize: 9, color: C.muted, marginTop: 2 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.muted },
});

function priorityColor(p: string) {
  if (p === "high") return C.danger;
  if (p === "medium") return C.warning;
  return C.muted;
}

export interface ReportPDFData {
  reportType: "session_review" | "champion_focus" | "climb_roadmap";
  riotId: string;
  rank: string | null;
  createdAt: string;
  matchCount: number;
  summary: string | null;
  coachPersonaResponse: string | null;
  estimatedRankPotential: string | null;
  actionItems: Array<{ priority: number; action: string; howTo: string; expectedImpact: string; timeframe: string }> | null;
  // Pro-only
  strengths: Array<{ area: string; description: string; evidence: string }> | null;
  weaknesses: Array<{ area: string; description: string; priority: string; evidence: string; rootCause?: string }> | null;
  championRecommendations: Array<{ championName: string; reason: string; priority: string }> | null;
  isPro: boolean;
}

const REPORT_LABELS: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

export function ReportPDF({ data }: { data: ReportPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>LoL AI Coach</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>
              {REPORT_LABELS[data.reportType] ?? data.reportType}
            </Text>
            <Text style={styles.headerValue}>{data.riotId}</Text>
            {data.rank && <Text style={[styles.muted, { marginTop: 2 }]}>{data.rank}</Text>}
            <Text style={[styles.muted, { marginTop: 2 }]}>
              {new Date(data.createdAt).toLocaleDateString()} · {data.matchCount} matches
            </Text>
          </View>
        </View>

        {/* Rank potential banner — climb_roadmap only */}
        {data.reportType === "climb_roadmap" && data.estimatedRankPotential && (
          <View style={styles.rankBanner}>
            <Text style={styles.rankLabel}>Estimated Rank Potential</Text>
            <Text style={styles.rankValue}>{data.estimatedRankPotential}</Text>
            <Text style={styles.rankSub}>Based on your current performance trajectory</Text>
          </View>
        )}

        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.card}>
              <Text style={styles.body}>{data.summary}</Text>
            </View>
          </View>
        )}

        {/* Coach says */}
        {data.coachPersonaResponse && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coach Says</Text>
            <View style={styles.card}>
              <Text style={styles.italic}>{data.coachPersonaResponse}</Text>
            </View>
          </View>
        )}

        {/* Action items */}
        {data.actionItems && data.actionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Items</Text>
            {data.actionItems.map((item) => (
              <View key={item.priority} style={styles.actionRow}>
                <View style={styles.actionNum}>
                  <Text style={styles.actionNumText}>{item.priority}</Text>
                </View>
                <View style={styles.actionBody}>
                  <Text style={styles.actionTitle}>{item.action}</Text>
                  <Text style={styles.actionMeta}>{item.howTo}</Text>
                  <Text style={styles.actionMeta}>
                    Impact: {item.expectedImpact} · {item.timeframe}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pro: strengths + weaknesses */}
        {data.isPro && (
          <>
            {data.strengths && data.strengths.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Strengths</Text>
                <View style={styles.card}>
                  {data.strengths.map((s, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemTitle}>{s.area}</Text>
                      <Text style={styles.itemDesc}>{s.description}</Text>
                      <Text style={styles.itemEvidence}>{s.evidence}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {data.weaknesses && data.weaknesses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weaknesses</Text>
                <View style={styles.card}>
                  {data.weaknesses.map((w, i) => (
                    <View key={i} style={styles.itemRow}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: priorityColor(w.priority) + "33" }]}>
                          <Text style={[styles.badgeText, { color: priorityColor(w.priority) }]}>
                            {w.priority}
                          </Text>
                        </View>
                        <Text style={styles.itemTitle}>{w.area}</Text>
                      </View>
                      <Text style={styles.itemDesc}>{w.description}</Text>
                      {w.rootCause && (
                        <Text style={styles.italic}>Root cause: {w.rootCause}</Text>
                      )}
                      <Text style={styles.itemEvidence}>{w.evidence}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {data.championRecommendations && data.championRecommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Champion Recommendations</Text>
                <View style={styles.card}>
                  {data.championRecommendations.map((rec, i) => (
                    <View key={i} style={styles.champRow}>
                      <View style={[styles.badge, { backgroundColor: priorityColor(rec.priority) + "33", alignSelf: "flex-start", marginTop: 2 }]}>
                        <Text style={[styles.badgeText, { color: priorityColor(rec.priority) }]}>
                          {rec.priority}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.champName}>{rec.championName}</Text>
                        <Text style={styles.champReason}>{rec.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {!data.isPro && (
          <View style={[styles.card, { borderWidth: 1, borderColor: C.accent + "66" }]}>
            <Text style={[styles.muted, { textAlign: "center" }]}>
              Upgrade to Pro to unlock strengths, weaknesses, and champion recommendations in your PDF.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>LoL AI Coach — lol-ai-three.vercel.app</Text>
          <Text style={styles.footerText}>
            Generated {new Date(data.createdAt).toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
