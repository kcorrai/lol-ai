// Public API of the identity domain
// Only export what other domains/layers need to consume
export { authOptions } from "@/lib/auth/config";
export type { AuthUser, SessionStatus } from "@/types/auth.types";
