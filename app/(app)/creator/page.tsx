import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Streamer Kit",
  description:
    "Overlays for OBS and chat commands for Twitch, Kick and YouTube, built from your ranked history.",
};

export default function Page(): JSX.Element {
  return <PageClient />;
}
