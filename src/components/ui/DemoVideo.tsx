// Locally-rendered "How it works" walkthrough (see src/remotion/, `npm run render:video`).
// Muted + loop + playsInline so it autoplays inline on every browser without controls.
export function DemoVideo({ className }: { className?: string }): React.JSX.Element {
  return (
    <video
      className={className}
      src="/videos/how-it-works.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="How LoL AI Coach works: from Riot ID to a personal climb plan"
    />
  );
}
