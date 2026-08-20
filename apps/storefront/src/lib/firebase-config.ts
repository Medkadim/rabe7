// Firebase's web config values (apiKey, appId, etc.) are meant to be
// public — they identify the project, they don't authorize anything by
// themselves (that's what Firebase security rules are for) — so baking
// them into the client bundle via NEXT_PUBLIC_* is the normal, supported
// approach, same as NEXT_PUBLIC_API_URL elsewhere in this app.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
    : undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Every field above must be set for push to work — until the distributor
// finishes the Firebase project setup, this stays false and every caller
// treats push as simply unavailable rather than crashing.
export const isPushConfigured =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.messagingSenderId && !!firebaseConfig.appId && !!firebaseVapidKey;
