export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Predefined errors for common cases — keeps route handlers thin
export const Errors = {
  unauthorized: () => new ApiError("UNAUTHORIZED", "Authentication required", 401),

  twoFactorRequired: () =>
    new ApiError("TWO_FACTOR_REQUIRED", "Enter your two-factor code to finish signing in", 401),

  forbidden: (detail = "Access denied") => new ApiError("FORBIDDEN", detail, 403),

  notFound: (resource = "Resource") =>
    new ApiError("RESOURCE_NOT_FOUND", `${resource} not found`, 404),

  conflict: (detail: string) => new ApiError("CONFLICT", detail, 409),

  validation: (detail: string) => new ApiError("VALIDATION_ERROR", detail, 422),

  accountLimitReached: () =>
    new ApiError(
      "ACCOUNT_LIMIT_REACHED",
      "You have reached the maximum number of connected Riot accounts for your plan",
      403
    ),

  reportLimitReached: () =>
    new ApiError(
      "REPORT_LIMIT_REACHED",
      "You have used your monthly AI report limit. Upgrade to Pro for unlimited reports.",
      403
    ),

  dailyReportLimitReached: () =>
    new ApiError(
      "DAILY_REPORT_LIMIT_REACHED",
      "You can generate 1 report per day on the Free plan. Come back tomorrow or upgrade to Pro.",
      429
    ),

  proRequired: (feature: string) =>
    new ApiError("PRO_REQUIRED", `${feature} requires a Pro subscription.`, 403),

  riotAccountNotOwned: () =>
    new ApiError(
      "RIOT_ACCOUNT_NOT_OWNED",
      "This Riot account does not belong to your profile",
      403
    ),

  cannotDisconnectOnFreePlan: () =>
    new ApiError(
      "CANNOT_DISCONNECT_FREE_PLAN",
      "Free plan accounts cannot be disconnected. Upgrade to Pro to manage your linked accounts.",
      403
    ),

  emailNotVerified: () =>
    new ApiError(
      "EMAIL_NOT_VERIFIED",
      "Please verify your email address before generating AI reports.",
      403
    ),
} as const;
