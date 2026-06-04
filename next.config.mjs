import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */

const CSP = [
  "default-src 'self'",
  // Next.js App Router requires unsafe-inline for hydration scripts
  "script-src 'self' 'unsafe-inline'",
  // Tailwind inline styles + Google Fonts stylesheets
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files
  "font-src 'self' data: https://fonts.gstatic.com",
  // Champion/item images via Data Dragon + rank emblems via Community Dragon
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
  // Same-origin API calls + Sentry error reporting (client-side DSN upload)
  "connect-src 'self' https://*.ingest.sentry.io https://*.sentry.io",
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
