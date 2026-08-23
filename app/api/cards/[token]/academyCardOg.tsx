import type { AcademyCardData } from "@/domains/coaching/services/cardService";
import { W, H, C } from "./cardOgTokens";

/** The certificate image for a finished Academy track. */
export function AcademyCard({ d }: { d: AcademyCardData }) {
  const finished = new Date(d.finishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: W,
        height: H,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        fontFamily: "sans-serif",
      }}
    >
      <span style={{ color: C.brand, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
        LOL AI COACH — ACADEMY
      </span>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ color: C.muted, fontSize: 22 }}>{d.displayName} finished</span>
        <span style={{ color: C.text, fontSize: 68, fontWeight: 700, marginTop: 8 }}>
          {d.trackTitle}
        </span>

        <div style={{ display: "flex", gap: 56, marginTop: 40 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: C.brand, fontSize: 44, fontWeight: 700 }}>{d.lessonsTotal}</span>
            <span style={{ color: C.muted, fontSize: 18 }}>lessons</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: C.gold, fontSize: 44, fontWeight: 700 }}>
              {d.lessonsMastered}
            </span>
            {/* Mastered means their own ranked games moved, not that they read it. */}
            <span style={{ color: C.muted, fontSize: 18 }}>proved in ranked</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ color: C.muted, fontSize: 18 }}>{finished}</span>
        <span style={{ color: C.muted, fontSize: 18 }}>laneiq — learn the game</span>
      </div>
    </div>
  );
}
