import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";

// Same font stack as apps/storefront — see that layout.tsx for why (Plex
// Sans has a matching Arabic typeface, chosen deliberately for this).
const sora = localFont({
  src: [
    { path: "../fonts/sora-600.ttf", weight: "600", style: "normal" },
    { path: "../fonts/sora-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
});
const plexSans = localFont({
  src: [
    { path: "../fonts/plexsans-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/plexsans-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/plexsans-600.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../fonts/plexmono-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/plexmono-500.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "وصلة — تطبيق المندوب",
  description: "زيارة العملاء وإنشاء الطلبات مع وصلة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${sora.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
