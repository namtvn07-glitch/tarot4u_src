import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { TAROT_CARDS } from "@/data/tarotCards";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const lastModified = new Date("2026-08-29");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trai-bai`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/doc-sau`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/thu-vien`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dieu-khoan`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/chinh-sach-quyen-rieng-tu`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/chinh-sach-hoan-tien`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/tai-nguyen-khung-hoang`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const cardRoutes: MetadataRoute.Sitemap = TAROT_CARDS.map((card) => ({
    url: `${baseUrl}/thu-vien/${card.id}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...cardRoutes];
}
