import type { CareerCardData } from "@/domains/coaching/services/cardService";
import { W, H, C } from "./cardOgTokens";

function since(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: C.muted, fontSize: 16, letterSpacing: 1 }}>{label}</span>
      <span style={{ color: C.text, fontSize: 34, fontWeight: 700, marginTop: 6 }}>{value}</span>
    </div>
  );
}

export function CareerCard({ d }: { d: CareerCardData }) {
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
      <span style={{ color: C.brand, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
        LOL AI COACH — CAREER TIMELINE
      </span>

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 28 }}>
        <span style={{ color: C.text, fontSize: 44, fontWeight: 700 }}>{d.gameName}</span>
        <span style={{ color: C.muted, fontSize: 26 }}>#{d.tagLine}</span>
        <span style={{ color: C.muted, fontSize: 20, marginLeft: 8 }}>Level {d.summonerLevel}</span>
      </div>

      {/* Said on the card as well as on the page. The record starts where tracking
          started, and a card that implied otherwise would travel further than the page. */}
      <span style={{ color: C.muted, fontSize: 18, marginTop: 8 }}>
        Tracked since {since(d.trackedFrom)}
      </span>

      <div style={{ display: "flex", gap: 72, marginTop: 44 }}>
        <Figure label="GAMES" value={String(d.totalGames)} />
        <Figure label="HOURS" value={String(d.totalHours)} />
        <Figure label="RANK NOW" value={d.currentRank} />
        <Figure label="PEAK" value={d.peakRank} />
      </div>

      {d.signatureChampion && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 40 }}>
          <span style={{ color: C.muted, fontSize: 18, letterSpacing: 1 }}>SIGNATURE</span>
          <span style={{ color: C.brand, fontSize: 26, fontWeight: 700 }}>
            {d.signatureChampion}
          </span>
          <span style={{ color: C.muted, fontSize: 18 }}>
            {d.signatureChampionGames} games
          </span>
        </div>
      )}

      {d.headline && (
        <span style={{ color: C.text, fontSize: 22, marginTop: 18 }}>
          Best game — {d.headline}
        </span>
      )}

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
