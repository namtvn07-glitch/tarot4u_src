# Task: Giai đoạn 9 — SEO & Nội dung

> Created: 2026-08-29 · Slug: `phase-9-seo-noi-dung`

## Goal
78 trang lá bài (`/thu-vien/[cardId]`) và trang thư viện (`/thu-vien`) được
pre-render tĩnh (SSG) với title/description/OG/JSON-LD riêng từng trang,
site có `sitemap.xml` + `robots.txt` đúng chuẩn, và lỗi nội dung
`ventusAdvice` bị cắt cụt (78/78 lá) đã được vá — sẵn sàng để Google index
sau khi domain thật lên (Giai đoạn 10).

## Scope
**In**:
- Vá 78 chuỗi `ventusAdvice` bị cắt cụt trong `src/data/tarotCards.ts`
- Chuyển `/thu-vien` + `/thu-vien/[cardId]` từ Client Component sang Server
  Component: `generateStaticParams`, `generateMetadata` per-card,
  `dynamicParams = false`
- `src/app/sitemap.ts`, `src/app/robots.ts`
- JSON-LD (`Article` + `BreadcrumbList` cho trang lá bài, `WebSite`/
  `Organization` ở root layout)
- `metadataBase` + title template + `verification.google` (placeholder, chờ
  domain thật) ở `src/app/layout.tsx`
- Thêm `metadata` export cho 4 trang pháp lý/tài nguyên hiện chưa có title
  riêng (`dieu-khoan`, `chinh-sach-quyen-rieng-tu`, `chinh-sach-hoan-tien`,
  `tai-nguyen-khung-hoang`)
- OG image: dùng lại `/cards/<slug>.jpg` có sẵn (không sinh ảnh động)

**Out**:
- Không viết thêm nội dung mới ngoài việc vá câu bị cắt (đã chốt: vá tối
  thiểu, không mở rộng đoạn văn nghĩa ngược)
- Không tạo route `opengraph-image.tsx` động (đã chốt: dùng ảnh lá có sẵn)
- Google Search Console + submit sitemap thật — **không thể làm bằng code**,
  cần domain live + verify DNS/HTML (việc của Giai đoạn 10)
- Không đụng `src/app/page.tsx` (SPA trang chủ) hay các `Screen`/`Modal`
  component dùng chung — chỉ thêm wrapper mới, không sửa hợp đồng prop cũ
- Không sửa `data/cards.json` (dataset gốc, không phải nguồn render trang)

## Assumptions
- `NEXT_PUBLIC_SITE_URL` sẽ được set đúng domain thật ở Giai đoạn 10; cho
  tới lúc đó `sitemap.ts`/`robots.ts`/OG dùng giá trị dev
  (`http://localhost:3000`) — đây là hành vi đúng, không phải bug
- Ngày `datePublished`/`dateModified` trong JSON-LD dùng mốc cố định
  `2026-08-29` (khớp `updatedAt` các trang pháp lý hiện có), không cần
  tracking ngày sửa thật cho từng lá
- `psychologySummary` (đã đầy đủ câu, không cắt cụt) đủ tốt để làm meta
  description — không cần viết description riêng
- Siết `NEXT_PUBLIC_SITE_URL` bắt buộc ở prod (bỏ default localhost khi
  `isProd`) là thay đổi nhỏ, cùng pattern với các secret khác trong
  `env.ts` — làm luôn vì `sitemap.ts` phụ thuộc trực tiếp giá trị này

## Checklist
- [x] Plan approved
- [x] Vá nội dung — 78 `ventusAdvice`
- [x] Composed components — `LibraryChrome`, `LibraryIndexClient`,
      `CardDetailPageClient`
- [x] Pages / routes — SSG `/thu-vien`, `/thu-vien/[cardId]`,
      `sitemap.ts`, `robots.ts`
- [x] Meta tags — root layout + 4 trang pháp lý
- [x] JSON-LD — card page + root
- [x] Responsive: 375 / 768 / 1280 (xác nhận không đổi khi chuyển sang SSG)
- [x] Cả 2 theme (site hiện chỉ 1 dark theme, xác nhận cấu trúc tương thích)
- [x] Accessibility pass (điều hướng router.push thay window.location.href)
- [x] Gates green (lint / typecheck / build)
- [x] Learnings extracted

## Progress Log
- 2026-08-29 16:57: Vá toàn bộ 78 `ventusAdvice` trong `tarotCards.ts` hoàn chỉnh từ dataset `base-content.json`.
- 2026-08-29 16:58: Triển khai helper `structured-data.ts` (Organization, WebSite, Article, Breadcrumbs).
- 2026-08-29 16:58: Triển khai 3 wrapper components: `LibraryChrome`, `LibraryIndexClient`, `CardDetailPageClient`.
- 2026-08-29 16:58: Chuyển đổi `/thu-vien` và `/thu-vien/[cardId]` sang Server Component với SSG, `generateStaticParams`, `generateMetadata`, JSON-LD và `dynamicParams = false`.
- 2026-08-29 16:58: Tạo `sitemap.ts` (86 URLs) & `robots.ts`.
- 2026-08-29 16:58: Cập nhật root layout `metadataBase`, title template, Google verification placeholder, root JSON-LD và metadata cho 4 trang pháp lý.
- 2026-08-29 16:59: Kiểm tra typecheck (`tsc --noEmit`) và build production (`next build`) thành công rực rỡ với 104 static/SSG pages.

## Open Questions
- Không có — 2 quyết định mở (độ sâu nội dung, cách làm OG image) đã chốt
  qua AskUserQuestion trước khi viết plan này.
