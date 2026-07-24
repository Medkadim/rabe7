import type { MetadataRoute } from "next";

const routes = [
  "",
  "/repas",
  "/prix",
  "/comment-ca-marche",
  "/entreprises",
  "/a-propos",
  "/contact",
  "/faq",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://greenbox.ma";
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
