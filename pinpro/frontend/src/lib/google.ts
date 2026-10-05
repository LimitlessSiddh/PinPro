// Google sign-in shows only when Firebase is configured (or in e2e tests, which stub the popup).
export const googleSignInEnabled =
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY) || import.meta.env.MODE === 'test';
