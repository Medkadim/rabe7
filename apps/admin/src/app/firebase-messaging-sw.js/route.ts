// Served at /firebase-messaging-sw.js (the path Firebase's web SDK expects
// by default) — a route handler rather than a static file in public/
// because the config values below have to come from real env vars, not be
// hardcoded into a checked-in script. Same pattern as the storefront's
// (see apps/storefront/src/app/firebase-messaging-sw.js/route.ts) — this
// one is for staff push alerts (e.g. a new return) instead of customer ones.
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
      : "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const body = `
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

// A tab-closed / app-backgrounded push arrives here instead of a page's JS
// — Firebase's compat SDK auto-shows a system notification for any
// "notification" payload, so there's nothing else to wire up for the
// common case (see notifications.service.ts's sendPush on the API side).
const messaging = firebase.messaging();
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
    },
  });
}
