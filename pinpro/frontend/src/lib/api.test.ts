import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});
vi.stubGlobal('window', new EventTarget());

const { apiFetch, ApiError } = await import('./api');
const { clearSession, lastLogoutReason, getSession, setSession } = await import('./session');

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe('apiFetch', () => {
  beforeEach(() => store.clear());

  it('sends the session token and returns JSON', async () => {
    setSession({ token: 'abc', user: { id: 1, username: 'a' } });
    respond(200, { clubs: {} });
    await expect(apiFetch('/api/clubs')).resolves.toEqual({ clubs: {} });
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('ends the session on 401 so the app returns to login', async () => {
    setSession({ token: 'abc', user: { id: 1, username: 'a' } });
    respond(401, { error: 'expired' });
    await expect(apiFetch('/api/clubs')).rejects.toBeInstanceOf(ApiError);
    expect(getSession()).toBeNull();
    expect(lastLogoutReason()).toBe('expired');
  });

  it('a failed login (no session) does not mark anything expired', async () => {
    clearSession();
    respond(401, { error: 'Incorrect username or password.' });
    await expect(apiFetch('/api/auth/login', { method: 'POST', body: {} })).rejects.toThrow(
      'Incorrect username or password.'
    );
    expect(lastLogoutReason()).toBeNull();
  });

  it('turns network failures into a readable message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(apiFetch('/api/clubs')).rejects.toThrow(/can't reach/i);
  });
});

describe('session', () => {
  it('ignores malformed or legacy stored sessions', () => {
    store.set('pinpro.session', JSON.stringify({ token: 'x', user: { id: 'undefined' } }));
    expect(getSession()).toBeNull();
  });
});
