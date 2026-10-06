import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // /trai-bai (Rút Nhanh 1 lá) đã được thay bằng /hom-nay (Daily). Giữ đường cũ
  // sống: link quảng cáo affiliate cũ và chỉ mục Google vẫn trỏ vào đây. Query
  // (?ref=...) được Next giữ nguyên qua redirect nên attribution không mất.
  async redirects() {
    return [{ source: "/trai-bai", destination: "/hom-nay", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
