"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Verifying Google sign-in ID tokens only needs the Firebase project ID (tokens are checked against
// Google's public keys). Service-account credentials are used when fully configured, but aren't required.
// Initialised on first use so the API (and tests) can boot without any Firebase config.
function firebaseAuth() {
    if (!firebase_admin_1.default.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!projectId) {
            throw new Error('FIREBASE_PROJECT_ID is not set; Google sign-in cannot be verified');
        }
        firebase_admin_1.default.initializeApp(clientEmail && privateKey
            ? { projectId, credential: firebase_admin_1.default.credential.cert({ projectId, clientEmail, privateKey }) }
            : { projectId });
    }
    return firebase_admin_1.default.auth();
}
const verifyFirebaseToken = async (token) => {
    try {
        return await firebaseAuth().verifyIdToken(token);
    }
    catch (err) {
        console.error('Firebase token verification failed:', err.message);
        return null;
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
