"use client";

import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useAuth } from "./auth-context";
import { apiFetch } from "./api-client";
import { firebaseConfig, firebaseVapidKey, isPushConfigured } from "./firebase-config";

// Registers this browser for staff alerts (e.g. a new return declared by a
// sales rep — see NotificationsService.notifyNewReturn) once someone is
// signed in. No-ops entirely if Firebase isn't configured yet
// (isPushConfigured) or the browser doesn't support push — this must never
// be why sign-in or browsing the dashboard breaks.
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

        // The tab open in the foreground never gets the service worker's
        // auto-shown notification (that's a background-only browser
        // behavior) — show it manually so a signed-in, open dashboard tab
        // still alerts staff.
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
        // must never surface as a broken dashboard.
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, [status, accessToken]);
}
