export class FetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
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
    const message = (json as { error?: { message?: string } } | null)?.error?.message ?? "Request failed";
    throw new FetchError(message, res.status);
  }

  return (json as { data: T }).data;
}
