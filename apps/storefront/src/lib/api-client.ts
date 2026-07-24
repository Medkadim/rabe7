const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// A thin fetch wrapper the whole storefront uses to talk to the API. The
// access token is passed in per-call (it lives in memory, in AuthContext —
// see auth-context.tsx for why) rather than read from a global here, so
// this stays a pure function that's easy to test and reason about.
export async function apiFetch<T>(
  path: string,
  accessToken: string | null,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join(", ") : body.message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
