import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "LaneIQ Daily — League of Legends Champion Quiz",
  description:
    "Six new League of Legends champion puzzles every day: Classic, Ability, Splash, Lore, Quote and Emoji. Unlimited guesses, streaks that forgive a missed day, and no account needed.",
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: "LaneIQ Daily — League of Legends Champion Quiz",
    description:
      "Six new champion puzzles every day at midnight UTC. Guess from an ability icon, a splash crop, a redacted lore entry, a voice line or a string of emoji.",
    url: "/quiz",
    type: "website",
  },
};

export default function Page(): React.JSX.Element {
  return <PageClient />;
}
