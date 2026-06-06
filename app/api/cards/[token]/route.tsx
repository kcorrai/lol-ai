import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getCardByToken } from "@/domains/coaching/services/cardService";
import type { WeeklyCardData, MasteryCardData } from "@/domains/coaching/services/cardService";

export const runtime = "edge";

const W = 1200;
const H = 630;

// ── Colour tokens (inline only — Tailwind not available in next/og) ───────────
const C = {
  bg: "#0f1117",
  surface: "#1a1d27",
  border: "#2a2d3e",
  brand: "#6366f1",
  brandDim: "#4f52b8",
  gold: "#f59e0b",
  green: "#22c55e",
  red: "#ef4444",
  text: "#f1f5f9",
  muted: "#94a3b8",
  white: "#ffffff",
};

// ── Weekly card template ──────────────────────────────────────────────────────

function WeeklyCard({ d }: { d: WeeklyCardData }) {
  const lpColor = d.lpDelta >= 0 ? C.green : C.red;
  const lpSign = d.lpDelta >= 0 ? "+" : "";

  return (
    <div
      style={{
        width: W,
        height: H,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.brand, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            LOL AI COACH
          </span>
          <span style={{ color: C.text, fontSize: 32, fontWeight: 800, marginTop: 4 }}>
            {d.gameName}
            <span style={{ color: C.muted, fontWeight: 400, fontSize: 24 }}>#{d.tagLine}</span>
          </span>
        </div>
        <span style={{ color: C.muted, fontSize: 16 }}>Bu Hafta</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: "32px 0" }} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 48 }}>
        <StatBox label="LP Değişimi" value={`${lpSign}${d.lpDelta}`} color={lpColor} />
        <StatBox label="Kazanma Oranı" value={`%${d.winRate}`} color={C.text} />
        <StatBox label="Oynanan" value={`${d.gamesPlayed} Maç`} color={C.muted} />
        {d.coachGrade && (
          <StatBox label="AI Coach Notu" value={d.coachGrade} color={C.gold} />
        )}
      </div>

      {/* Best champion */}
      {d.bestChampionName !== "-" && (
        <div
          style={{
            marginTop: 40,
            padding: "20px 24px",
            background: C.surface,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <span style={{ color: C.muted, fontSize: 18 }}>En İyi Şampiyon</span>
          <span style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>
            {d.bestChampionName}
          </span>
          <span style={{ color: C.green, fontSize: 20 }}>%{d.bestChampionWinRate} WR</span>
          {d.masteryScore !== null && (
            <span style={{ color: C.brand, fontSize: 18 }}>
              Mastery {d.masteryScore}/100
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: C.muted, fontSize: 16 }}>lolaicoach.com</span>
        {!d.isPro && (
          <span style={{ color: C.brandDim, fontSize: 14 }}>Made with LoL AI Coach</span>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ color: C.muted, fontSize: 16 }}>{label}</span>
      <span style={{ color, fontSize: 40, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

// ── Mastery card template ─────────────────────────────────────────────────────

function MasteryCard({ d }: { d: MasteryCardData }) {
  const tierColor =
    d.masteryTier === "Legend"
      ? C.gold
      : d.masteryTier === "Master"
      ? C.brand
      : d.masteryTier === "Expert"
      ? C.green
      : C.muted;

  return (
    <div
      style={{
        width: W,
        height: H,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand */}
      <span style={{ color: C.brand, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
        LOL AI COACH — CHAMPION MASTERY
      </span>

      <div style={{ display: "flex", marginTop: 32, gap: 48, alignItems: "flex-start" }}>
        {/* Score column */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.muted, fontSize: 20 }}>
            {d.gameName}#{d.tagLine}
          </span>
          <span style={{ color: C.text, fontSize: 28, fontWeight: 700, marginTop: 8 }}>
            {d.championName}
          </span>
          <span style={{ color: tierColor, fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {d.masteryTier}
          </span>

          {/* Progress bar */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 16 }}>Mastery Score</span>
              <span style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>
                {d.masteryScore}/100
              </span>
            </div>
            <div
              style={{
                width: 480,
                height: 16,
                background: C.surface,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${d.masteryScore}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.brandDim}, ${tierColor})`,
                  borderRadius: 8,
                }}
              />
            </div>
          </div>

          <span style={{ color: C.muted, fontSize: 16, marginTop: 24 }}>
            {d.gamesPlayed} ranked maçta hesaplandı
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: C.muted, fontSize: 16 }}>lolaicoach.com</span>
        {!d.isPro && (
          <span style={{ color: C.brandDim, fontSize: 14 }}>Made with LoL AI Coach</span>
        )}
      </div>
    </div>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  let result: Awaited<ReturnType<typeof getCardByToken>>;

  try {
    result = await getCardByToken(params.token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return new Response(null, { status: 404 });
    return new Response(null, { status: 500 });
  }

  if (result.expired) return new Response(null, { status: 410 });

  const { data } = result;
  const element =
    data.cardType === "mastery" ? (
      <MasteryCard d={data as MasteryCardData} />
    ) : (
      <WeeklyCard d={data as WeeklyCardData} />
    );

  return new ImageResponse(element, {
    width: W,
    height: H,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
