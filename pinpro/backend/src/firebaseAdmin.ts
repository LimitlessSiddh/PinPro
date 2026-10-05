import admin from 'firebase-admin';

// Verifying Google sign-in ID tokens only needs the Firebase project ID (tokens are checked against
// Google's public keys). Service-account credentials are used when fully configured, but aren't required.
// Initialised on first use so the API (and tests) can boot without any Firebase config.
function firebaseAuth() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not set; Google sign-in cannot be verified');
    }
    admin.initializeApp(
      clientEmail && privateKey
        ? { projectId, credential: admin.credential.cert({ projectId, clientEmail, privateKey }) }
        : { projectId }
    );
  }
  return admin.auth();
}

export const verifyFirebaseToken = async (token: string) => {
  try {
    return await firebaseAuth().verifyIdToken(token);
  } catch (err) {
    console.error('Firebase token verification failed:', (err as Error).message);
    return null;
  }
};
