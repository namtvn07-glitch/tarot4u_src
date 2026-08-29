import { env } from "@/lib/env";
import type { TarotCard } from "@/types/tarot";

export function buildOrganizationJsonLd() {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ventus Tarot",
    url: siteUrl,
    logo: `${siteUrl}/cards/the-magician.jpg`,
  };
}

export function buildWebSiteJsonLd() {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ventus Tarot",
    url: siteUrl,
    description: "Khám Phá Vận Mệnh & Thông Điệp Vũ Trụ qua 78 Lá Bài Tarot",
  };
}

export function buildArticleJsonLd(card: TarotCard) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const imageFilename = card.image_filename || `${card.id}.jpg`;
  const pageUrl = `${siteUrl}/thu-vien/${card.id}`;
  const imageUrl = `${siteUrl}/cards/${imageFilename}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Ý Nghĩa Lá Bài ${card.nameVi} (${card.name})`,
    description: card.psychologySummary || card.quote || `Tìm hiểu ý nghĩa chi tiết lá bài Tarot ${card.nameVi} (${card.name})`,
    image: imageUrl,
    datePublished: "2026-08-29",
    dateModified: "2026-08-29",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Organization",
      name: "Ventus Tarot",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Ventus Tarot",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/cards/the-magician.jpg`,
      },
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const position = index + 1;
      const element: Record<string, unknown> = {
        "@type": "ListItem",
        position,
        name: item.name,
      };

      if (item.url) {
        element.item = item.url.startsWith("http")
          ? item.url
          : `${siteUrl}${item.url.startsWith("/") ? item.url : `/${item.url}`}`;
      }

      return element;
    }),
  };
}
