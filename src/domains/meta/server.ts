// Server-only public API of the meta domain. Kept out of `index.ts` for the same reason the
// draft domain keeps one: `index.ts` is imported by client components, and this pulls in the
// cache layer and its Prisma client.
export { warmMetaCache } from "@/domains/meta/services/metaWarmService";
export type { WarmMetaResult } from "@/domains/meta/services/metaWarmService";
