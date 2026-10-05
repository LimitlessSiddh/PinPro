import { useState } from 'react';
import { apiFetch, errorMessage } from '../lib/api';
import { setSession, type Session } from '../lib/session';
import { Alert, Spinner } from './ui';

declare global {
  interface Window {
    __pinproGoogleToken?: string; // e2e only: stands in for the Google popup
  }
}

const getGoogleIdToken = async (): Promise<string | null> => {
  if (import.meta.env.MODE === 'test' && window.__pinproGoogleToken) return window.__pinproGoogleToken;

  // Loaded on demand: keeps Firebase out of the main bundle and lets the app run without its config.
  const [{ auth, googleProvider }, { signInWithPopup, signOut }] = await Promise.all([
    import('../firebase'),
    import('firebase/auth'),
  ]);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await result.user.getIdToken();
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null;
    if (code === 'auth/popup-blocked') throw new Error('Your browser blocked the Google sign-in window. Allow pop-ups and try again.');
    throw new Error('Google sign-in failed. Please try again.');
  } finally {
    // PinPro's own session token is what keeps you signed in, not Firebase's.
    signOut(auth).catch(() => undefined);
  }
};

const GoogleLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      // Only a confirmed server session logs you in. A failed sync used to leave a half-logged-in state.
      const session = await apiFetch<Session>('/api/auth/sync-firebase-user', { method: 'POST', token: idToken });
      setSession(session);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? (
          <Spinner className="h-5 w-5" />
        ) : (
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
        )}
        Continue with Google
      </button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
};

export default GoogleLoginButton;
