const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// A thin fetch wrapper the whole admin app uses to talk to the API. The
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

// Separate from apiFetch on purpose: a multipart upload must NOT send
// Content-Type itself — the browser sets it (with the boundary) once it
// sees the body is a FormData, and forcing "application/json" like
// apiFetch does would break the upload.
export async function uploadImage(
  file: File,
  accessToken: string | null,
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/uploads/images`, {
    method: "POST",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join(", ") : body.message);
  }

  return response.json() as Promise<{ url: string; key: string }>;
}
