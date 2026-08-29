import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TAROT_CARDS } from "@/data/tarotCards";
import { LibraryChrome } from "@/components/library/LibraryChrome";
import { CardDetailPageClient } from "@/components/library/CardDetailPageClient";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return TAROT_CARDS.map((card) => ({
    cardId: card.id,
  }));
}

interface CardPageProps {
  params: Promise<{ cardId: string }>;
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = TAROT_CARDS.find((c) => c.id === cardId);

  if (!card) {
    return {
      title: "Không Tìm Thấy Lá Bài",
    };
  }

  const title = `${card.nameVi} (${card.name}) — Ý Nghĩa Lá Bài Tarot`;
  const description =
    card.psychologySummary ||
    card.quote ||
    `Khám phá ý nghĩa chi tiết lá bài Tarot ${card.nameVi} (${card.name}) trong tình yêu, sự nghiệp và đời sống.`;
  const imageFilename = card.image_filename || `${card.id}.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [`/cards/${imageFilename}`],
    },
  };
}

export default async function CardDetailPage({ params }: CardPageProps) {
  const { cardId } = await params;
  const card = TAROT_CARDS.find((c) => c.id === cardId);

  if (!card) {
    notFound();
  }

  const articleJsonLd = buildArticleJsonLd(card);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Trang chủ", url: "/" },
    { name: "Thư Viện 78 Lá Bài", url: "/thu-vien" },
    { name: card.nameVi, url: `/thu-vien/${card.id}` },
  ]);

  return (
    <LibraryChrome currentScreen="library">
      <CardDetailPageClient card={card} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </LibraryChrome>
  );
}
