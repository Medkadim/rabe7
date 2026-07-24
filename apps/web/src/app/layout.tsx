import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://greenbox.ma"),
  title: {
    default: "GreenBox — Votre pause déjeuner, notre engagement",
    template: "%s | GreenBox",
  },
  description:
    "Des repas maison, équilibrés et variés, préparés chaque jour avec amour par des femmes talentueuses, livrés au bureau à Tanger.",
  keywords: [
    "GreenBox",
    "livraison de repas",
    "déjeuner bureau",
    "Tanger",
    "repas sains",
    "abonnement repas",
  ],
  openGraph: {
    title: "GreenBox — Votre pause déjeuner, notre engagement",
    description:
      "Des repas maison, équilibrés et variés, livrés chaque jour au bureau à Tanger.",
    url: "https://greenbox.ma",
    siteName: "GreenBox",
    locale: "fr_MA",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
