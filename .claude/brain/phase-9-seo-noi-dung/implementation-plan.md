# Giai đoạn 9 — SEO & Nội dung

Biến 78 trang lá bài + trang thư viện từ CSR-toàn-bộ (client component, meta
tag chung cho mọi trang, không có trong `sitemap.xml` vì file này chưa tồn
tại) thành SSG thật với metadata/JSON-LD riêng từng trang, đồng thời vá một
lỗi nội dung có sẵn (`ventusAdvice` bị cắt cụt trên cả 78 lá) chặn ngay việc
publish trang chất lượng thấp.

## Decisions Needed From You
> [!IMPORTANT]
> Không còn quyết định mở — 2 điểm cần chốt trước khi viết plan đã được hỏi
> và chốt:
> - Độ sâu nội dung: **vá tối thiểu** câu `ventusAdvice` bị cắt, không viết
>   thêm đoạn nghĩa ngược
> - OG image: **dùng ảnh lá bài có sẵn** (`/cards/<slug>.jpg`), không sinh
>   ảnh động qua `next/og`
>
> Một thay đổi nhỏ ngoài phạm vi gốc mà tôi cho là nên làm trong lúc này —
> nói nếu muốn bỏ: siết `NEXT_PUBLIC_SITE_URL` bắt buộc (không default
> `localhost`) khi `NODE_ENV=production` trong `src/lib/env.ts`, cùng
> pattern đã áp dụng cho `SUPABASE_SERVICE_ROLE_KEY`/`READING_TOKEN_SECRET`.
> Lý do: `sitemap.ts`/`robots.ts`/OG mới sẽ đọc trực tiếp biến này — quên
> set ở Giai đoạn 10 sẽ khiến sitemap production trỏ về `localhost:3000` mà
> không có lỗi nào báo.

## Approach

Giữ nguyên toàn bộ component hiện có (`Header`, `Footer`, `LibraryScreen`,
`CardDetailScreen`, `CardDetailModal`) — không đổi prop contract của chúng
vì `src/app/page.tsx` (SPA trang chủ) đang tiêu thụ cùng các component này
qua một cơ chế điều hướng nội bộ khác hẳn (state switch, không phải route).
Thay vào đó, 2 route `/thu-vien` và `/thu-vien/[cardId]` được viết lại thành
Server Component (bắt buộc để dùng `generateStaticParams`/`generateMetadata`
— hai API này không export được từ Client Component), và phần tương tác
(auth, modal, điều hướng) được tách ra 3 wrapper Client Component mới, nhỏ,
chỉ làm đúng việc "cầu nối props" giữa Server Component cha và Client
Component con có sẵn.

Nội dung `ventusAdvice` được vá trực tiếp trong `src/data/tarotCards.ts` —
đây là nguồn dữ liệu build-time duy nhất cho các trang này (không phải
`base_content` trong Supabase, vốn là Lớp Nền cho luồng trải bài, khác mục
đích).

**Considered and rejected**
- Đổi `CardDetailScreen`/`LibraryScreen` nhận `router.push` trực tiếp thay
  vì callback prop — gọn hơn nhưng phải sửa luôn cách `src/app/page.tsx`
  (SPA) gọi 2 component này, tăng blast radius ra ngoài phạm vi Giai đoạn 9
  mà không cần thiết cho mục tiêu SEO
- Dùng `next/og` `ImageResponse` sinh OG image riêng từng lá — đã hỏi và
  người dùng chọn dùng ảnh lá có sẵn để giảm phạm vi
- Viết lại toàn bộ nội dung 78 lá (không chỉ vá câu cụt) — đã hỏi và người
  dùng chọn vá tối thiểu

## Proposed Changes

### Content Fix
#### [MODIFY] `src/data/tarotCards.ts`
- Hoàn thiện lại 78 giá trị `ventusAdvice` đang bị cắt cụt giữa từ (xác
  nhận bằng grep: `"ventusAdvice": "[^"]*[^.!?)]",$` khớp cả 78/78 dòng,
  trong khi `psychologySummary`/`careerFinance`/`loveRelationship` là 0/78
  — chỉ field này bị lỗi). Viết tiếp đúng mạch câu đang dang dở, giữ giọng
  văn hiện có (2nd person, "bạn"), không đổi các field khác.
- Verify: grep pattern trên phải trả về 0 match sau khi sửa.

### Components (mới, nhỏ, chỉ làm cầu nối)
#### [NEW] `src/components/library/LibraryChrome.tsx`
- `"use client"`. Nhận `currentScreen: AppScreen`, `children`.
- Gom logic đang bị lặp y hệt ở cả 2 page hiện tại: `useAuthUser()`,
  `Header`/`Footer`, `AuthModal`, `CreditTopUpModal`, và map
  `AppScreen → path` cho `onNavigate` (dùng `useRouter().push`, thay vì
  `window.location.href` như code cũ — điều hướng client, không full
  reload).
- Không xử lý `CardDetailModal` (chỉ trang thư viện cần, xem dưới).

#### [NEW] `src/components/library/LibraryIndexClient.tsx`
- `"use client"`. Render `<LibraryScreen>` + `<CardDetailModal>` (modal xem
  nhanh khi click 1 lá trong grid).
- `onNavigateToCardDetail` → `router.push('/thu-vien/' + card.id)`
- `onStartDeepReadWithCard` → `router.push('/doc-sau?inquiry=...')`

#### [NEW] `src/components/library/CardDetailPageClient.tsx`
- `"use client"`. Nhận `card` (serializable, từ Server Component cha) làm
  prop. Render `<CardDetailScreen card={card} .../>`.
- `onStartDeepReadWithInquiry` → `router.push('/doc-sau?inquiry=...')`
- `onNavigate` → `router.push('/thu-vien')`

### Pages / Routes
#### [MODIFY] `src/app/thu-vien/page.tsx`
- Bỏ `"use client"`. Trở thành Server Component thuần, export
  `metadata: Metadata` tĩnh (title, description, OG cho trang thư viện).
- Render `<LibraryChrome currentScreen="library"><LibraryIndexClient /></LibraryChrome>`
  + `<BreadcrumbJsonLd items={[Home, "Thư Viện 78 Lá Bài"]} />`

#### [MODIFY] `src/app/thu-vien/[cardId]/page.tsx`
- Bỏ `"use client"`. Server Component với:
  - `export const dynamicParams = false` — 78 lá là tập đóng, `cardId`
    ngoài danh sách phải trả 404 thật, không fallback âm thầm về
    `TAROT_CARDS[0]` như code cũ (`card = TAROT_CARDS.find(...) || TAROT_CARDS[0]`
    — đây là soft-404 hiện có, sẽ bị xoá)
  - `generateStaticParams()` → `TAROT_CARDS.map(c => ({ cardId: c.id }))`
  - `generateMetadata({ params })` → title
    `` `${card.nameVi} (${card.name}) — Ý Nghĩa Lá Bài Tarot` ``, description
    ghép `card.psychologySummary` + câu gợi ý chuẩn, `openGraph.images`
    trỏ `/cards/${card.image_filename}`
  - Component: tìm card qua `TAROT_CARDS.find`, gọi `notFound()` nếu không
    có (phòng hờ dù `dynamicParams=false` đã chặn ở build)
  - Render `<LibraryChrome currentScreen="library"><CardDetailPageClient card={card} /></LibraryChrome>`
    + `<ArticleJsonLd card={card} />` + `<BreadcrumbJsonLd items={[Home, "Thư Viện 78 Lá Bài", card.nameVi]} />`

#### [NEW] `src/app/sitemap.ts`
- `export default function sitemap(): MetadataRoute.Sitemap`
- Static routes: `/`, `/trai-bai`, `/doc-sau`, `/thu-vien`, `/dieu-khoan`,
  `/chinh-sach-quyen-rieng-tu`, `/chinh-sach-hoan-tien`,
  `/tai-nguyen-khung-hoang`
- Dynamic: `TAROT_CARDS.map(c => \`/thu-vien/${c.id}\`)` — 78 URL
- Loại trừ: `/dang-nhap`, `/tai-khoan`, `/nap-credits`,
  `/nap-credits/ket-qua` (private/transactional, không có giá trị SEO)
- Base URL từ `env.NEXT_PUBLIC_SITE_URL`

#### [NEW] `src/app/robots.ts`
- `export default function robots(): MetadataRoute.Robots`
- `disallow: ['/api/', '/tai-khoan', '/auth/', '/nap-credits/ket-qua']`
- `sitemap: \`${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml\``

### Meta tags / Structured data
#### [MODIFY] `src/app/layout.tsx`
- Thêm `metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL)` (bắt buộc để OG
  image tương đối resolve đúng domain)
- `title: { default: "...", template: "%s | Ventus Tarot" }` thay vì string
  tĩnh — để mọi `generateMetadata` con chỉ cần set phần riêng
- `verification: { google: env.GOOGLE_SITE_VERIFICATION }` — optional,
  không set thì Next tự bỏ qua field
- Thêm JSON-LD `Organization` + `WebSite` (script tag, `dangerouslySetInnerHTML`
  với JSON đã `JSON.stringify` — không nhận input người dùng nên an toàn)

#### [NEW] `src/lib/structured-data.ts`
- Helper thuần (không phải component) build object JSON-LD:
  `buildOrganizationJsonLd()`, `buildArticleJsonLd(card)`,
  `buildBreadcrumbJsonLd(items)` — trả object, page tự
  `<script type="application/ld+json">{JSON.stringify(...)}</script>`

#### [MODIFY] 4 trang pháp lý — thêm `metadata` export còn thiếu
- `src/app/dieu-khoan/page.tsx`
- `src/app/chinh-sach-quyen-rieng-tu/page.tsx`
- `src/app/chinh-sach-hoan-tien/page.tsx`
- `src/app/tai-nguyen-khung-hoang/page.tsx`
- Mỗi trang thêm `export const metadata: Metadata = { title: "...", description: "..." }` — hiện cả 4 trang này đang thừa hưởng title/description chung của trang chủ, không đúng nội dung riêng.

### Env
#### [MODIFY] `src/lib/env.ts`
- `NEXT_PUBLIC_SITE_URL`: đổi thành `isProd ? z.string().url() : z.string().url().default("http://localhost:3000")` — bắt buộc ở prod, cùng pattern các secret khác trong file
- Thêm `GOOGLE_SITE_VERIFICATION: z.string().min(1).optional()` — placeholder chờ Giai đoạn 10 verify domain thật trên Search Console

## Accessibility Plan
- Semantic structure: không đổi — toàn bộ markup trong `LibraryScreen`/
  `CardDetailScreen` giữ nguyên, chỉ đổi component nào gọi chúng
- Keyboard path: điều hướng đổi từ `window.location.href` (full reload)
  sang `router.push` (client nav) trong 3 wrapper mới — hành vi Tab/focus
  không đổi so với trước, Next.js App Router tự quản lý focus khi đổi route
- Không có màu/contrast mới — không style gì mới được thêm, chỉ cấu trúc
  routing
- JSON-LD là `<script>` ẩn, không ảnh hưởng a11y

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `src/data/tarotCards.ts` (`ventusAdvice`) | `CardDetailScreen.tsx` (hiển thị trực tiếp), `src/app/page.tsx` (SPA card-detail screen) | Thấp — chỉ thay nội dung chuỗi, không đổi shape dữ liệu |
| `src/app/thu-vien/page.tsx`, `.../[cardId]/page.tsx` | Route độc lập, không ai import 2 file này | Thấp — không consumer nào khác ngoài Next router |
| `Header`, `Footer`, `LibraryScreen`, `CardDetailScreen`, `CardDetailModal` | **Không sửa** — chỉ thêm caller mới | Không có |
| `src/app/layout.tsx` (title template) | Mọi page trong app (title giờ compose qua `%s`) | Trung bình — page nào đang set `metadata.title` dạng string đầy đủ (vd. các trang pháp lý sau khi thêm ở bước này) sẽ tự động có hậu tố `" | Ventus Tarot"`; cần rà lại 4 trang pháp lý sau khi thêm metadata để title không bị lặp "Ventus Tarot" 2 lần |
| `src/lib/env.ts` (`NEXT_PUBLIC_SITE_URL` siết prod) | Mọi chỗ đọc `env.NEXT_PUBLIC_SITE_URL` — hiện chưa có chỗ nào ngoài `sitemap.ts`/`robots.ts`/`layout.tsx` mới thêm | Thấp ở dev (có default), **chặn build ở Vercel nếu quên set env** — đúng ý đồ (fail loud), nhưng cần note vào checklist Giai đoạn 10 |

## Verification Plan
### Automated
```
.claude/hooks/detect-stack.sh
npm run lint
npx tsc --noEmit
npm run build     # xác nhận 78 trang /thu-vien/[cardId] xuất hiện trong build output dạng ● (SSG), không phải ƒ (dynamic)
```

### Manual
1. `npm run dev` → mở `/thu-vien`, `/thu-vien/the-fool`, `/thu-vien/death` —
   xác nhận render giống hệt trước khi đổi (không vỡ layout), ở 375/768/1280px
2. View source (không phải DevTools Elements) trang `/thu-vien/the-fool` —
   xác nhận `<title>`, `<meta description>`, `<meta property="og:*">` xuất
   hiện đúng trong HTML ban đầu (chứng minh SSG thật, không phải client-only)
3. `curl localhost:3000/sitemap.xml` — đếm đúng số URL (8 static + 78 lá =
   86), `curl localhost:3000/robots.txt` — có dòng `Sitemap:`
4. Thử `/thu-vien/khong-ton-tai` — phải ra trang 404 thật (không phải trang
   "The Fool" như hành vi cũ)
5. Dán JSON-LD từ view-source vào Google Rich Results Test (thủ công,
   không tự động hoá được) — xác nhận không lỗi schema
6. Tab qua Header/Footer/nút "Trải Bài Sâu Với Lá Này" trên trang card
   detail mới — xác nhận vẫn điều hướng đúng, focus không bị mất
7. Grep lại `"ventusAdvice": "[^"]*[^.!?)]",$` trong `tarotCards.ts` — phải
   0 match

## Out of Scope
- Google Search Console verify + submit sitemap thật — cần domain live,
  chuyển sang checklist Giai đoạn 10
- Viết thêm nội dung nghĩa ngược / mở rộng biên tập — đã chốt không làm
- OG image động theo từng lá — đã chốt dùng ảnh có sẵn
- Sửa `src/app/page.tsx` (SPA trang chủ) và luồng "card-detail" nội bộ của
  nó — không liên quan SEO (URL không đổi khi chuyển screen ở đó)
- `data/cards.json` (dataset gốc Giai đoạn 1) — không phải nguồn render,
  không cần đồng bộ lại với bản vá `ventusAdvice`
