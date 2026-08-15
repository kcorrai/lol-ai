import type { getPublicReport } from "@/domains/coaching/services/reportService";

type PublicReport = Awaited<ReturnType<typeof getPublicReport>>;

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

export function ReportOgCard({ report }: { report: PublicReport }) {
  const reportLabel = REPORT_TYPE_LABEL[report.reportType] ?? report.reportType;
  const insight = report.summary
    ? report.summary.slice(0, 115) + (report.summary.length > 115 ? "…" : "")
    : "AI-powered coaching insight";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "1200px",
        height: "630px",
        background: "#080B0A",
        padding: "52px 64px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
        <div
          style={{
            background: "#C6FF3D",
            color: "#080B0A",
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "9999px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginRight: "14px",
          }}
        >
          LoL AI Coach
        </div>
        <span style={{ color: "#6C817B", fontSize: "13px" }}>{reportLabel}</span>
      </div>

      {/* Player name + tag */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
        <span style={{ fontSize: "44px", fontWeight: 800, color: "#E9F5EE" }}>
          {report.gameName}
        </span>
        <span
          style={{
            fontSize: "14px",
            color: "#6C817B",
            background: "#17201F",
            padding: "4px 10px",
            borderRadius: "6px",
          }}
        >
          #{report.tagLine}
        </span>
      </div>

      {/* Rank + champion badges */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
        {report.rankDisplay && (
          <div
            style={{
              background: "#C6FF3D18",
              border: "1px solid #C6FF3D50",
              color: "#C6FF3D",
              fontSize: "13px",
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: "6px",
            }}
          >
            {report.rankDisplay}
          </div>
        )}
        {report.topChampionName && (
          <div
            style={{
              background: "#17201F",
              border: "1px solid #20302D",
              color: "#6C817B",
              fontSize: "13px",
              padding: "5px 14px",
              borderRadius: "6px",
            }}
          >
            {report.topChampionName}
          </div>
        )}
      </div>

      {/* Insight box */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0C1110",
          border: "1px solid #20302D",
          borderRadius: "12px",
          padding: "28px 36px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#C6FF3D",
            marginBottom: "12px",
          }}
        >
          AI Coach Insight
        </div>
        <div
          style={{
            fontSize: "20px",
            lineHeight: "1.5",
            color: "#E9F5EE",
            fontStyle: "italic",
          }}
        >
          {"“"}{insight}{"”"}
        </div>
      </div>

      {/* Footer CTA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "22px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#6C817B" }}>lolaicoach.gg</span>
        <div
          style={{
            background: "#C6FF3D",
            color: "#080B0A",
            fontSize: "14px",
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: "8px",
          }}
        >
          Get your own AI report →
        </div>
      </div>
    </div>
  );
}
