import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  // Dev mode needs unsafe-eval for Next.js HMR/Fast Refresh runtime, and
  // @vercel/analytics loads its debug script cross-origin from
  // va.vercel-scripts.com when NODE_ENV is development. Production serves the
  // same script from the same origin (/_vercel/insights/script.js), so the host
  // is allowed in dev only and the production policy is unchanged. Without it
  // every page logs a CSP violation, which is exactly the noise that hides a
  // real error.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  // Tailwind inline styles + Google Fonts stylesheets
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Google Fonts files
  "font-src 'self' data: https://fonts.gstatic.com",
  // Champion/item images via Data Dragon + rank emblems via Community Dragon +
  // team/league/player logos for the esports section (ADR-016)
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org https://static.lolesports.com https://lolstatic-a.akamaihd.net",
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
      {
        // Esports team, league and player logos. The feed publishes some of
        // these over http; every URL is upgraded before it reaches an <Image>.
        protocol: "https",
        hostname: "static.lolesports.com",
        pathname: "/**",
      },
      {
        // The same assets are served from Riot's Akamai host on older records.
        protocol: "https",
        hostname: "lolstatic-a.akamaihd.net",
        pathname: "/**",
      },
      {
        // Legends of Runeterra Data Dragon — the only Riot CDN that serves wide,
        // full-resolution poro illustrations (League's own CDN tops out at 128–300px
        // profile icons for them).
        protocol: "https",
        hostname: "dd.b.pvp.net",
        pathname: "/latest/**",
      },
    ],
  },
  async redirects() {
    // Old authed tool routes are now public keyword URLs under /tools.
    //
    // `/draft` used to be in this list, pointing at /tools/draft-analyzer. It is
    // now the live draft room's own page (TASK-307), and a redirect wins over a
    // page — so the entry had to go or the room was unreachable. The analyser
    // keeps /tools/draft-analyzer, which is where every internal link points.
    return [
      { source: "/counter", destination: "/tools/counter-picker", permanent: true },
      { source: "/matchup", destination: "/tools/matchup", permanent: true },
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
          // Two years + preload-eligible. Browsers ignore HSTS on localhost, so
          // this does not break plaintext local development.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // The app uses none of these; denying them removes the surface outright.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
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
