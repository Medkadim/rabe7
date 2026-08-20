"use client";

import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useAuth } from "./auth-context";
import { apiFetch } from "./api-client";
import { firebaseConfig, firebaseVapidKey, isPushConfigured } from "./firebase-config";

// Registers this browser for "new product / new promotion" push alerts
// once the customer is signed in. No-ops entirely if the distributor
// hasn't finished the Firebase setup yet (isPushConfigured) or the browser
// doesn't support push (older WebViews, Safari without the right flags) —
// this must never be why sign-in or browsing breaks.
export function usePushNotifications() {
  const { accessToken, status } = useAuth();

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    if (!isPushConfigured) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    let cancelled = false;

    async function register() {
      try {
        if (Notification.permission === "denied") return;
        const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const app = getApps()[0] ?? initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration: registration,
        });
        if (!token || cancelled) return;

        await apiFetch("/notifications/register-device", accessToken, {
          method: "POST",
          body: JSON.stringify({ token, platform: "WEB" }),
        });

        // The app open in the foreground never gets the service worker's
        // auto-shown notification (that's a background-only browser
        // behavior) — show it manually so a signed-in, open tab still
        // alerts the customer.
        onMessage(messaging, (payload) => {
          if (Notification.permission === "granted" && payload.notification) {
            new Notification(payload.notification.title ?? "Waslak", {
              body: payload.notification.body,
            });
          }
        });
      } catch {
        // Push is a nice-to-have — a permission prompt dismissal, an
        // unsupported browser quirk, or a transient network error here
        // must never surface to the customer as a broken app.
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, [status, accessToken]);

  // The Android wrapper app (apps/android) has its own native FCM
  // integration instead of the browser-based flow above — see
  // MainActivity.kt / WaslaMessagingService. It has no access to this app's
  // in-memory access token, so instead of building a separate native
  // networking path, it calls this window function (once the page has
  // loaded and this effect had a chance to define it) and lets the
  // already-authenticated web app register the token itself.
  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    if (typeof window === "undefined") return;

    const bridge = window as unknown as { __wasla_registerFcmToken?: (token: string) => void };
    bridge.__wasla_registerFcmToken = (token: string) => {
      void apiFetch("/notifications/register-device", accessToken, {
        method: "POST",
        body: JSON.stringify({ token, platform: "ANDROID" }),
      }).catch(() => undefined);
    };

    return () => {
      delete bridge.__wasla_registerFcmToken;
    };
  }, [status, accessToken]);
}
