import type { Metadata } from "next";
import { Orbitron, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/auth/provider";
import { PostHogProvider } from "@/lib/analytics/PostHogProvider";
import "@/styles/globals.css";

// LaneIQ sets three families (ADR-015): Orbitron for display, Chakra Petch for
// UI and body, JetBrains Mono for every numeral, label and timestamp.
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LoL AI Coach — AI-Powered League of Legends Coaching",
    template: "%s | LoL AI Coach",
  },
  description:
    "Connect your Riot account. Get specific, honest feedback on what's holding you back. Stop being hardstuck.",
  keywords: ["League of Legends", "coaching", "AI", "improve", "rank"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "LoL AI Coach",
    title: "LoL AI Coach — AI-Powered League of Legends Coaching",
    description:
      "Free LoL tools and AI coaching: counters, matchups, drafts and tier lists from real ranked data.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoL AI Coach — AI-Powered League of Legends Coaching",
    description:
      "Free LoL tools and AI coaching: counters, matchups, drafts and tier lists from real ranked data.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${chakraPetch.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
