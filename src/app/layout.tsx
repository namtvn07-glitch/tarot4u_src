import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AmbientSoundPlayer } from "@/components/AmbientSoundPlayer";
import { env } from "@/lib/env";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/structured-data";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "VENTUS TAROT — Khám Phá Vận Mệnh & Thông Điệp Vũ Trụ",
    template: "%s | Ventus Tarot",
  },
  description: "Trải bài Tarot trực tuyến thông minh với kiến trúc giải bài 2 lớp và không gian âm thanh huyền bí.",
  keywords: ["tarot", "bói bài tarot", "trải bài 3 lá", "ventus tarot", "thần số học"],
  openGraph: {
    title: "VENTUS TAROT — Soi Sáng Hành Trình Nội Tâm",
    description: "Trải nghiệm rút bài Tarot 3D thần bí kết hợp luận giải chuyên sâu.",
    type: "website",
  },
  verification: env.GOOGLE_SITE_VERIFICATION
    ? {
        google: env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebSiteJsonLd();

  return (
    <html lang="vi" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-[#050505] text-[#f3ece1] min-h-screen flex flex-col relative overflow-x-hidden selection:bg-[#d4af37] selection:text-[#050505]">
        {/* Background Texture & Ambient Glow Overlay */}
        <div className="fixed inset-0 w-full h-full pointer-events-none bg-grain z-0 opacity-40" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-[#8f5a1f]/10 via-[#d4af37]/5 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />

        {/* Dynamic Content */}
        <div className="relative z-10 flex-grow flex flex-col">
          {children}
        </div>

        {/* Global Ambient Audio Synthesizer */}
        <AmbientSoundPlayer />
      </body>
    </html>
  );
}
