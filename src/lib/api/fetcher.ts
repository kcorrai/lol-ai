export class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = (json as { error?: { message?: string; code?: string } } | null)?.error;
    const message = errBody?.message ?? "Request failed";
    const errorCode = errBody?.code;
    throw new FetchError(message, res.status, errorCode);
  }

  if (json === null || typeof json !== "object" || !("data" in json)) {
    throw new FetchError("Unexpected response format", res.status);
  }
  return (json as { data: T }).data;
}
