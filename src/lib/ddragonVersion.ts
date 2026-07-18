// Synchronous fallback used by client components to build patch-versioned image
// URLs. Keep this reasonably current; server code that needs the exact live patch
// should await getLatestDdragonVersion() instead.
export const DDRAGON_VERSION = "16.13.1";
