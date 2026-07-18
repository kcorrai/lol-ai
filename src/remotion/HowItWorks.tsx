import { AbsoluteFill, Sequence } from "remotion";
import { COLORS, FONT } from "./theme";
import { Intro } from "./scenes/Intro";
import { EnterId } from "./scenes/EnterId";
import { ScanMatches } from "./scenes/ScanMatches";
import { Report } from "./scenes/Report";
import { Climb } from "./scenes/Climb";

// ~15s walkthrough: intro → enter Riot ID → AI scans matches → report → climb.
export const HowItWorks = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONT }}>
      {/* subtle grid + glow backdrop */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 50% 30%, rgba(200,155,60,0.10), transparent 60%)",
        }}
      />
      <Sequence durationInFrames={80}>
        <Intro />
      </Sequence>
      <Sequence from={80} durationInFrames={110}>
        <EnterId />
      </Sequence>
      <Sequence from={190} durationInFrames={140}>
        <ScanMatches />
      </Sequence>
      <Sequence from={330} durationInFrames={80}>
        <Report />
      </Sequence>
      <Sequence from={410} durationInFrames={40}>
        <Climb />
      </Sequence>
    </AbsoluteFill>
  );
};
