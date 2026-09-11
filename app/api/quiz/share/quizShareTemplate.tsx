import type { ShareCardModel, ShareTile } from "@/domains/quiz";

// The drawn scorecard. Everything is a box or a run of text — no remote images,
// no emoji glyphs — so the card renders identically wherever it is opened and
// cannot be held up by a Data Dragon request. Satori supports a flexbox subset,
// which is why every container below is explicitly `display: flex`.

const INK = "#050706";
const SURFACE = "#0C1110";
const LINE = "#20302D";
const ACCENT = "#C6FF3D";
const AMBER = "#FFC24B";
const FG1 = "#E9F5EE";
const FG3 = "#6C817B";
const FG4 = "#485954";

const TILE_COLOURS: Record<ShareTile, { background: string; border: string }> = {
  miss: { background: "rgba(255,194,75,0.32)", border: AMBER },
  hit: { background: ACCENT, border: ACCENT },
  fail: { background: "#111918", border: LINE },
};

function Tile({ kind }: { kind: ShareTile }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        width: "30px",
        height: "30px",
        background: TILE_COLOURS[kind].background,
        border: `2px solid ${TILE_COLOURS[kind].border}`,
      }}
    />
  );
}

function Row({ row }: { row: ShareCardModel["rows"][number] }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "58px",
        padding: "0 26px",
        background: row.played ? SURFACE : "transparent",
        border: `1px solid ${row.played ? LINE : "#131C1A"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "210px",
          fontSize: "22px",
          letterSpacing: "0.14em",
          color: row.played ? FG1 : FG4,
        }}
      >
        {row.label}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexGrow: 1 }}>
        {row.tiles.map((tile, index) => (
          <Tile key={index} kind={tile} />
        ))}
        {row.overflow && <div style={{ display: "flex", fontSize: "22px", color: AMBER }}>+</div>}
        {!row.played && (
          <div style={{ display: "flex", fontSize: "19px", letterSpacing: "0.18em", color: FG4 }}>
            NOT PLAYED
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          width: "44px",
          justifyContent: "flex-end",
          fontSize: "26px",
          fontWeight: 700,
          color: row.played ? (row.tally === "X" ? AMBER : ACCENT) : FG4,
        }}
      >
        {row.tally}
      </div>
    </div>
  );
}

/** The 1000×1000 card. */
export function QuizShareCard({ model }: { model: ShareCardModel }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "1000px",
        height: "1000px",
        background: INK,
        fontFamily: "system-ui, sans-serif",
        color: FG1,
      }}
    >
      <div style={{ display: "flex", height: "8px", background: ACCENT }} />

      <div style={{ display: "flex", flexDirection: "column", padding: "44px 52px", flexGrow: 1 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: "16px", height: "16px", background: ACCENT }} />
          <div
            style={{
              display: "flex",
              marginLeft: "16px",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            LANEIQ DAILY
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: "30px",
              letterSpacing: "0.1em",
              color: FG3,
            }}
          >
            #{model.puzzleNumber}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", marginTop: "40px" }}>
          <div style={{ display: "flex", fontSize: "150px", fontWeight: 800, lineHeight: 1 }}>
            {model.solved}
            <span style={{ color: FG3 }}>/{model.total}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "24px",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", fontSize: "26px", letterSpacing: "0.2em", color: FG3 }}>
              SOLVED
            </div>
            <div style={{ display: "flex", fontSize: "22px", color: FG4, marginTop: "6px" }}>
              {model.played} of {model.total} played
            </div>
          </div>

          {model.streak > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "auto",
                marginBottom: "14px",
                alignItems: "flex-end",
                padding: "14px 22px",
                border: `2px solid ${ACCENT}`,
                background: "rgba(198,255,61,0.10)",
              }}
            >
              <div style={{ display: "flex", fontSize: "54px", fontWeight: 800, color: ACCENT }}>
                {model.streak}
              </div>
              <div
                style={{ display: "flex", fontSize: "18px", letterSpacing: "0.2em", color: FG3 }}
              >
                DAY STREAK
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", marginTop: "30px" }}>
          {model.rows.map((row) => (
            <div
              key={row.mode}
              style={{
                display: "flex",
                height: "10px",
                flexGrow: 1,
                background: row.tiles.includes("hit")
                  ? ACCENT
                  : row.played
                    ? "rgba(255,194,75,0.5)"
                    : "#17201F",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            marginTop: "32px",
            marginBottom: "34px",
          }}
        >
          {model.rows.map((row) => (
            <Row key={row.mode} row={row} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: "26px", color: ACCENT, letterSpacing: "0.1em" }}>
            laneiq.gg/quiz
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: "20px", color: FG4 }}>
            Names no champion — safe to post
          </div>
        </div>
      </div>
    </div>
  );
}
