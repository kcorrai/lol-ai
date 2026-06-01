import { ApiError } from "@/lib/api/errors";

// Riot API HTTP status → our internal ApiError.
// Callers never see raw fetch Response objects — only typed domain errors.
export function normalizeRiotError(
  status: number,
  retryAfterSeconds?: number
): ApiError & { retryAfterMs?: number } {
  switch (status) {
    case 400:
      return Object.assign(
        new ApiError("RIOT_BAD_REQUEST", "Invalid request to Riot API", 400),
        {}
      );
    case 401:
      return Object.assign(
        new ApiError("RIOT_UNAUTHORIZED", "Invalid or missing Riot API key", 401),
        {}
      );
    case 403:
      return Object.assign(
        new ApiError("RIOT_FORBIDDEN", "Riot API key does not have access to this endpoint", 403),
        {}
      );
    case 404:
      return Object.assign(
        new ApiError("RIOT_NOT_FOUND", "Resource not found on Riot API", 404),
        {}
      );
    case 429: {
      const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : undefined;
      return Object.assign(
        new ApiError("RIOT_RATE_LIMITED", "Riot API rate limit exceeded", 429),
        { retryAfterMs }
      );
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return Object.assign(
        new ApiError("RIOT_API_UNAVAILABLE", "Riot API is temporarily unavailable", 503),
        {}
      );
    default:
      return Object.assign(
        new ApiError(
          "RIOT_API_ERROR",
          `Unexpected Riot API response: HTTP ${status}`,
          502
        ),
        {}
      );
  }
}
