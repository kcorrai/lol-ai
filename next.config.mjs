import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  // Dev mode needs unsafe-eval for Next.js HMR/Fast Refresh runtime
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind inline styles + Google Fonts stylesheets
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files
  "font-src 'self' data: https://fonts.gstatic.com",
  // Champion/item images via Data Dragon + rank emblems via Community Dragon
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
  // Official champion ability preview videos (Riot CloudFront)
  "media-src 'self' https://d28xe8vt774jo5.cloudfront.net",
  // Same-origin API calls + DDragon JSON data + Sentry error reporting
  "connect-src 'self' https://ddragon.leagueoflegends.com https://*.ingest.sentry.io https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "raw.communitydragon.org",
        pathname: "/latest/**",
      },
    ],
  },
  async redirects() {
    // Old authed tool routes are now public keyword URLs under /tools.
    return [
      { source: "/counter", destination: "/tools/counter-picker", permanent: true },
      { source: "/matchup", destination: "/tools/matchup", permanent: true },
      { source: "/draft", destination: "/tools/draft-analyzer", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // No SENTRY_AUTH_TOKEN needed — source map upload disabled
  sourcemaps: {
    disable: true,
  },
  webpack: {
    // Disable auto-instrumentation to keep build times fast
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
