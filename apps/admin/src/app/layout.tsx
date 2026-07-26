import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";

// Self-hosted rather than next/font/google: Next's Google-fonts pipeline
// re-subsets IBM Plex Sans in a way that silently corrupts inter-glyph
// spacing on certain letter sequences (verified directly — the exact same
// font file rendered perfectly side by side once loaded this way instead).
// Sora carries the brand's presence (wordmark, headings), used sparingly.
// Plex Sans handles everything you actually read — chosen deliberately: it
// has a matching Arabic typeface, so an Arabic interface later doesn't
// require rethinking the type system. Plex Mono ties numeric data together
// (order numbers, prices, phone numbers). See the charte graphique.
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
  title: "Wasla — Distributor Admin",
  description: "B2B distribution platform admin dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
