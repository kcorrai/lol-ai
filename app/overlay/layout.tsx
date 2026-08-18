import type { ReactNode } from "react";

// The overlay's own shell.
//
// An OBS Browser Source composites the page onto the streamer's scene, so the
// page itself must paint nothing. That cannot be done from a nested element:
// `globals.css` puts `bg-background` and a fixed grid image on `body` itself, so
// wrapping the widget in a transparent div still leaves a solid dark rectangle
// sitting in the scene. The reset therefore has to target `body`, which is what
// this style block is for.
//
// The rule is scoped by `:has()` rather than applied globally — it only fires on
// a document that actually contains an overlay root, so nothing else in the app
// can pick it up.
export default function OverlayLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <>
      <style>{`
        body:has(#laneiq-overlay-root) {
          background-color: transparent;
          background-image: none;
        }
      `}</style>
      <div id="laneiq-overlay-root" className="min-h-screen bg-transparent p-0">
        {children}
      </div>
    </>
  );
}
