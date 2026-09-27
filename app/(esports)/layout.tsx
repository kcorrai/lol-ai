import { MarketingHeader } from "../(marketing)/components/MarketingHeader";
import { MarketingFooter } from "../(marketing)/components/MarketingFooter";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { EsportsNav } from "@/domains/esports/components/EsportsNav";
import { SpoilerToggle } from "@/domains/esports/components/SpoilerToggle";
import { TimeZoneSelect } from "@/domains/esports/components/TimeZoneSelect";
import { SPOILER_PREPAINT_SCRIPT } from "@/domains/esports/spoilerScript";

/**
 * The section's chrome: spoiler mode applied before paint, then the tab row
 * with the viewer's settings at its end. Shared by both shells below.
 */
function SectionChrome(): React.ReactElement {
  return (
    <>
      {/* Runs as the HTML is parsed, before anything below it paints, so a
          reader who hides scores never sees one flash up. */}
      <script dangerouslySetInnerHTML={{ __html: SPOILER_PREPAINT_SCRIPT }} />
      <EsportsNav
        actions={
          <>
            <TimeZoneSelect />
            <SpoilerToggle />
          </>
        }
      />
    </>
  );
}

/**
 * How far down a sticky day or league heading has to stop.
 *
 * The two branches below scroll differently: the app shell scrolls its own
 * `<main>`, so a heading stuck at its top clears the chrome by itself, while the
 * marketing branch scrolls the window under a 62px header a heading would
 * otherwise vanish behind. Sections read it off this variable rather than
 * guessing which shell they are in.
 */
const APP_STICKY_TOP = { "--esports-sticky-top": "0px" } as React.CSSProperties;
const MARKETING_STICKY_TOP = { "--esports-sticky-top": "62px" } as React.CSSProperties;

// The esports section is public and built for search, but signed-in members reach it from the
// sidebar too. Same split as the Free Tools (TASK-237), chosen in the browser by PublicChrome:
// reading the session here made every esports page dynamic and switched ISR off (ADR-059).
export default function EsportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicChrome
      header={<MarketingHeader />}
      footer={<MarketingFooter />}
      appStyle={APP_STICKY_TOP}
      marketingStyle={MARKETING_STICKY_TOP}
    >
      <SectionChrome />
      {children}
    </PublicChrome>
  );
}
