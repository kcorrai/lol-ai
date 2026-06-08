import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/auth/provider";
import { PostHogProvider } from "@/lib/analytics/PostHogProvider";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
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
      <body className={`${inter.variable} ${rajdhani.variable} font-sans`}>
          <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
        <Analytics />
        </body>
    </html>
  );
}
