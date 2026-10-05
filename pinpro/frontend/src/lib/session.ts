import { useSyncExternalStore } from 'react';

export type User = { id: number; username: string };
export type Session = { token: string; user: User };

const KEY = 'pinpro.session';
const CHANGE = 'pinpro:session';
// Keys written by older versions of the app; cleared so stale half-sessions can't linger.
const LEGACY_KEYS = ['token', 'firebaseToken', 'userId', 'username', 'userEmail', 'userName'];

let logoutReason: 'expired' | null = null;

const read = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): Session | null => {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    const valid =
      typeof s?.token === 'string' &&
      s.token.length > 0 &&
      Number.isInteger(s.user?.id) &&
      typeof s.user?.username === 'string';
    return valid ? s : null;
  } catch {
    return null;
  }
};

// Cache by raw string so useSyncExternalStore gets a stable snapshot.
let cachedRaw: string | null = null;
let cached: Session | null = null;
export const getSession = (): Session | null => {
  const raw = read();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
};

const notify = () => window.dispatchEvent(new Event(CHANGE));

export const setSession = (session: Session): void => {
  logoutReason = null;
  localStorage.setItem(KEY, JSON.stringify(session));
  notify();
};

export const clearSession = (reason: 'expired' | null = null): void => {
  logoutReason = reason;
  try {
    localStorage.removeItem(KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable: nothing to clear
  }
  notify();
};

export const clearLegacyKeys = (): void => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

// Lets the login page explain why the user landed there. Reset by the next login or logout.
export const lastLogoutReason = () => logoutReason;

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener('storage', onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener('storage', onChange);
  };
};

export const useSession = () => useSyncExternalStore(subscribe, getSession);
