import { clearSession, getSession } from './session';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://pinpro.onrender.com').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: string; body?: unknown; token?: string };

// All API calls go through here: adds the session token, turns failures into readable messages,
// and ends the session on 401 so the app falls back to the login screen.
export async function apiFetch<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const session = getSession();
  const bearer = token ?? session?.token;

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the PinPro server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Only an authenticated request can "expire"; a failed login attempt is just a 401 message.
    if (res.status === 401 && session && !token && bearer === session.token) {
      clearSession('expired');
    }
    const message =
      typeof data?.error === 'string' ? data.error : `Something went wrong (error ${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';
