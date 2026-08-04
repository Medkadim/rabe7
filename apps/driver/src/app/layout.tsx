import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";

// Self-hosted rather than next/font/google: Next's Google-fonts pipeline
// re-subsets IBM Plex in a way that silently corrupts inter-glyph spacing
// on certain letter sequences (verified directly — the exact same font
// file rendered perfectly side by side once loaded this way instead), so
// every weight is fetched and bundled as a local file instead. Plus
// Jakarta Sans carries all UI text (Waslak's brand typeface, per the
// charte graphique); Plex Mono ties numeric data together (order numbers,
// prices, phone numbers).
const jakarta = localFont({
  src: [
    { path: "../fonts/jakarta-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/jakarta-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/jakarta-600.ttf", weight: "600", style: "normal" },
    { path: "../fonts/jakarta-700.ttf", weight: "700", style: "normal" },
    { path: "../fonts/jakarta-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../fonts/plexmono-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/plexmono-600.ttf", weight: "600", style: "normal" },
    { path: "../fonts/plexmono-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Waslak — تطبيق السائق",
  description: "توصيل الطلبات مع Waslak",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${jakarta.variable} ${plexMono.variable}`}
    >
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
