import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "LaneIQ Daily — League of Legends Champion Quiz",
  description:
    "Eight new League of Legends champion puzzles every day: Classic, Ability, Splash, Lore, Quote, Emoji, Build and Impostor. Unlimited guesses, streaks that forgive a missed day, and no account needed.",
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: "LaneIQ Daily — League of Legends Champion Quiz",
    description:
      "Eight new champion puzzles every day at midnight UTC. Guess from an ability icon, a splash crop, a redacted lore entry, a voice line, a string of emoji or an item path — or find the impostor.",
    url: "/quiz",
    type: "website",
  },
};

export default function Page(): React.JSX.Element {
  return <PageClient />;
}
