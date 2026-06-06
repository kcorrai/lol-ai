import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

// react-pdf only supports a limited CSS subset and built-in fonts.
// Keep colours simple (no opacity shortcuts), no rem units, no Tailwind.
const S = StyleSheet.create({
  page:        { backgroundColor: "#ffffff", paddingHorizontal: 40, paddingVertical: 36, fontFamily: "Helvetica", fontSize: 9, color: "#1a1a2e" },
  accent:      { color: "#C89B3C" },
  muted:       { color: "#6b7280" },

  // Header
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  brand:       { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#C89B3C", letterSpacing: 1 },
  headerMeta:  { fontSize: 8, color: "#6b7280", textAlign: "right" },

  // Section
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 14, color: "#C89B3C", textTransform: "uppercase", letterSpacing: 0.5 },
  card:         { backgroundColor: "#f9fafb", borderRadius: 4, padding: 10, marginBottom: 8 },
  cardBorderL:  { borderLeftWidth: 3, paddingLeft: 8 },
  successBorder:{ borderLeftColor: "#22c55e" },
  dangerBorder: { borderLeftColor: "#ef4444" },
  accentBorder: { borderLeftColor: "#C89B3C" },

  // Text
  label:       { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  body:        { fontSize: 9, lineHeight: 1.5, color: "#374151" },
  small:       { fontSize: 8, color: "#6b7280", marginTop: 2 },
  badge:       { fontSize: 7, fontFamily: "Helvetica-Bold", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  highBadge:   { backgroundColor: "#fee2e2", color: "#dc2626" },
  medBadge:    { backgroundColor: "#fef9c3", color: "#ca8a04" },
  lowBadge:    { backgroundColor: "#f3f4f6", color: "#6b7280" },

  // Flex helpers
  row:         { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  dot:         { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  greenDot:    { backgroundColor: "#22c55e" },
  redDot:      { backgroundColor: "#ef4444" },
  flex1:       { flex: 1 },

  // Footer
  footer:      { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:  { fontSize: 7, color: "#9ca3af" },
});

function Header({ report }: { report: CoachingReportDetail }) {
  const dateStr = report.completedAt
    ? new Date(report.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const typeLabel: Record<string, string> = {
    session_review: "Session Review",
    champion_focus: "Champion Focus",
    climb_roadmap: "Climb Roadmap",
  };

  return (
    <View style={S.header}>
      <View>
        <Text style={S.brand}>LOL AI COACH</Text>
        <Text style={[S.body, { marginTop: 2 }]}>AI Coaching Report</Text>
        {report.focusArea && <Text style={[S.small, { marginTop: 1 }]}>Focus: {report.focusArea}</Text>}
      </View>
      <View>
        <Text style={S.headerMeta}>{typeLabel[report.reportType] ?? report.reportType}</Text>
        <Text style={S.headerMeta}>{dateStr}</Text>
        <Text style={S.headerMeta}>{report.matchesAnalyzed.length} matches analysed</Text>
        {report.estimatedRankPotential && (
          <Text style={[S.headerMeta, S.accent, { marginTop: 2 }]}>Potential: {report.estimatedRankPotential}</Text>
        )}
      </View>
    </View>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <View>
      <Text style={S.sectionTitle}>Summary</Text>
      <View style={[S.card, S.cardBorderL, S.accentBorder]}>
        <Text style={S.body}>{summary}</Text>
      </View>
    </View>
  );
}

function CoachSection({ text }: { text: string }) {
  return (
    <View>
      <Text style={S.sectionTitle}>Coach Says</Text>
      <View style={[S.card, S.cardBorderL, S.accentBorder]}>
        <Text style={[S.body, { fontFamily: "Helvetica-Oblique" }]}>&quot;{text}&quot;</Text>
      </View>
    </View>
  );
}

function StrengthsSection({ strengths }: { strengths: NonNullable<CoachingReportDetail["strengths"]> }) {
  return (
    <View>
      <Text style={S.sectionTitle}>Strengths</Text>
      {strengths.map((s, i) => (
        <View key={i} style={S.row}>
          <View style={[S.dot, S.greenDot]} />
          <View style={S.flex1}>
            <Text style={[S.label, { color: "#15803d" }]}>{s.area}</Text>
            <Text style={S.body}>{s.description}</Text>
            {s.evidence && <Text style={S.small}>{s.evidence}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function WeaknessesSection({ weaknesses }: { weaknesses: NonNullable<CoachingReportDetail["weaknesses"]> }) {
  const badgeStyle = (p: string) =>
    p === "high" ? S.highBadge : p === "medium" ? S.medBadge : S.lowBadge;

  return (
    <View>
      <Text style={S.sectionTitle}>Weaknesses</Text>
      {weaknesses.map((w, i) => (
        <View key={i} style={S.row}>
          <Text style={[S.badge, badgeStyle(w.priority)]}>{w.priority.toUpperCase()}</Text>
          <View style={S.flex1}>
            <Text style={[S.label, { color: "#dc2626" }]}>{w.area}</Text>
            <Text style={S.body}>{w.description}</Text>
            {w.rootCause && <Text style={S.small}>Root cause: {w.rootCause}</Text>}
            {w.evidence && <Text style={S.small}>{w.evidence}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function ActionPlanSection({ items }: { items: NonNullable<CoachingReportDetail["actionItems"]> }) {
  return (
    <View>
      <Text style={S.sectionTitle}>Action Plan</Text>
      {items.map((item, i) => (
        <View key={i} style={[S.card, S.cardBorderL, S.accentBorder, { marginBottom: 6 }]}>
          <Text style={[S.label, S.accent]}>#{item.priority} — {item.action}</Text>
          <Text style={[S.body, { marginTop: 3 }]}>{item.howTo}</Text>
          <View style={[S.row, { marginTop: 4, gap: 12 }]}>
            <Text style={S.small}>Impact: {item.expectedImpact}</Text>
            <Text style={S.small}>Timeline: {item.timeframe}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ChampionsSection({ recs }: { recs: NonNullable<CoachingReportDetail["championRecommendations"]> }) {
  return (
    <View>
      <Text style={S.sectionTitle}>Champions to Focus</Text>
      {recs.map((rec, i) => (
        <View key={i} style={S.row}>
          <View style={[S.dot, { backgroundColor: "#C89B3C", marginTop: 4 }]} />
          <View style={S.flex1}>
            <Text style={[S.label, S.accent]}>{rec.championName}</Text>
            <Text style={S.body}>{rec.reason}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface Props {
  report: CoachingReportDetail;
  isPro: boolean;
}

export function ReportPdfDocument({ report, isPro }: Props) {
  return (
    <Document title="LoL AI Coaching Report" author="LoL AI Coach">
      <Page size="A4" style={S.page}>
        <Header report={report} />

        {report.summary && <SummarySection summary={report.summary} />}
        {report.coachPersonaResponse && <CoachSection text={report.coachPersonaResponse} />}

        {isPro && (
          <>
            {report.strengths && report.strengths.length > 0 && <StrengthsSection strengths={report.strengths} />}
            {report.weaknesses && report.weaknesses.length > 0 && <WeaknessesSection weaknesses={report.weaknesses} />}
            {report.actionItems && report.actionItems.length > 0 && <ActionPlanSection items={report.actionItems} />}
            {report.championRecommendations && report.championRecommendations.length > 0 && (
              <ChampionsSection recs={report.championRecommendations} />
            )}
          </>
        )}

        <View style={S.footer} fixed>
          <Text style={S.footerText}>LoL AI Coach — lolaicoach.gg</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
