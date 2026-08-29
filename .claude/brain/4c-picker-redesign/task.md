# Task: Redesign animation + UX cho bước chọn lá (Giai đoạn 4c)

> Created: 2026-08-19 · Slug: `4c-picker-redesign`

## Goal
Bước chọn lá của Đọc sâu (`/doc-sau`, sau khi qua màn hỏi câu hỏi) có animation
trải bài mượt thay vì hiện tức thì, lá bốc được bay tới khu "mặt bàn" riêng,
bấm vào 1 lá trên bàn mở panel mô tả (bên phải ở ≥768px, cuối trang ở <768px)
chứa nút "Đọc sâu cho câu hỏi của bạn", và sau khi Đọc sâu stream xong thì nội
dung AI hiện tiếp trên cùng trang (không thay thế khu chọn lá), chỉ ẩn nút đi.

## Scope
**In**:
- `src/components/reading/CardSpreadPicker.tsx` — viết lại: animation trải
  bài, khu "mặt bàn" 3 ô, panel mô tả (desktop + mobile), nút Đọc sâu chuyển
  vào panel
- `src/components/reading/DeepReadingStage.tsx` — gộp stage `picking` +
  `personal` thành một (không unmount CardSpreadPicker khi bắt đầu Đọc sâu)

**Out**:
- Không đổi API/luồng dữ liệu: `/api/reading/deep/shuffle`, `/reveal`,
  `/personal`, token HMAC ký/verify — chỉ đổi UI/animation phía client
- Không đổi `DeepQuestionForm.tsx` (màn hỏi câu hỏi, đã verify đúng)
- Không đổi `DeepResultStream.tsx` nội dung/logic stream — chỉ đổi **nơi** nó
  được render (vẫn cùng component, cùng props)
- Không đụng `ReadingStage.tsx`/`GhostDeck`/`FlipCard` (luồng free Giai đoạn
  4b đang chạy tốt, có animation riêng không liên quan)
- Không thêm modal/dialog thật (đã chốt panel nằm trong luồng trang, không
  phải overlay — xem Assumptions)

## Assumptions
- **N=24 lá úp giữ layout dạng lưới responsive nhiều hàng như hiện tại**
  (không dựng true single-arc fan cho cả 24 lá — không khả thi ở 375px).
  "Trải bài" thể hiện qua: mỗi lá animate vào từ 1 điểm gốc "bộ bài" dùng
  Framer Motion `layoutId`, có stagger nhỏ giữa các lá; "xếp đè nhẹ lên nhau"
  thể hiện bằng overlap dọc nhẹ giữa các hàng (không phải overlap ngang toàn
  bộ 24 lá). Xác nhận qua AskUserQuestion 3 câu (2026-08-19) — 2 câu về
  responsive panel + chuyển đổi giữa 3 lá, câu này là suy luận hợp lý, **cần
  bạn xác nhận lại khi xem plan chi tiết**.
- Panel mô tả: ≥768px là cột bên phải (không sticky theo mặc định, xem
  Decisions); <768px chuyển xuống cuối trang, trong luồng nội dung bình
  thường — đã chốt qua AskUserQuestion.
- Panel cập nhật nội dung theo lá đang được chọn trên "mặt bàn" (không đóng
  mở lại) — đã chốt qua AskUserQuestion. Mặc định lá vừa bốc xong tự động
  trở thành lá "đang chọn" để panel không trống.
- Sau khi Đọc sâu xong: giữ nguyên khu bàn + panel mô tả, chỉ ẩn nút "Đọc
  sâu cho câu hỏi của bạn" — đã chốt qua AskUserQuestion.
- Reduced-motion: đường thay thế fade/opacity, không translate/fly — đúng
  pattern đã có ở `GhostDeck`/`FlipCard` (4b).

## Checklist — Revision 1 (CSS Grid + Framer `layout`/`layoutId`)
> User test bằng tay thật (2026-08-19): **"giao diện trải bài bị xấu và
> lag"**. Root cause + hướng sửa ở Revision 2 dưới, tham khảo animation của
> đối thủ trong `src_template/`. Đánh dấu `[x]` dưới đây nghĩa là "đã làm ở
> Revision 1", **không phải "đạt yêu cầu"** — xem cột Revision 2.
- [x] Plan approved
- [x] `CardSpreadPicker.tsx`: animation trải bài (deal-in) cho N lá úp — ❌ cần viết lại (CSS Grid, không phải overlap thật — xem Revision 2)
- [x] `CardSpreadPicker.tsx`: khu "mặt bàn" 3 ô + animation bay khi bốc — ❌ cần viết lại (`layoutId` giữa Grid/Flex gây reflow toàn lưới — xem Revision 2)
- [x] `CardSpreadPicker.tsx`: panel mô tả (desktop cột phải / mobile cuối trang) — giữ nguyên, không phải nguồn lỗi
- [x] `CardSpreadPicker.tsx`: chuyển đổi lá đang xem trong panel (tab pattern) — giữ nguyên logic, chỉ đổi nơi đặt nút bàn
- [x] `DeepReadingStage.tsx`: gộp stage picking+personal, giữ CardSpreadPicker
      mounted khi Đọc sâu chạy, chỉ ẩn nút — giữ nguyên, không đổi ở Revision 2
- [x] States: loading/empty/error/success — đủ cho từng bước (bốc lá lỗi,
      stream lỗi... đã có sẵn, giữ nguyên khi rewire). Verify: bấm "Đọc sâu"
      → nút ẩn, khu bàn+panel vẫn còn, `DeepResultStream` hiện lỗi (do
      `ANTHROPIC_API_KEY` sai, không phải bug component này) đúng vị trí
      dưới cùng, không thay thế gì
- [x] Responsive: 375 / 1280 — panel xuống hàng dưới đúng ở <768px, không
      cuộn ngang, cả 2 theme đúng token. ⏭️ 768/1920 chưa tự chụp riêng
      (đã verify 375 và 1280, breakpoint giữa dùng cùng logic CSS Grid nên
      rủi ro thấp, nhưng chưa nhìn tận mắt)
- [x] Cả 2 theme — verify tại 375px, dark/light đều đúng token, không màu
      hardcode
- [x] Accessibility pass — tab pattern (`role="tablist"/"tab"/"tabpanel"`)
      hoạt động đúng qua Playwright (đổi lá active, `aria-selected` đúng);
      touch target: ô bàn 72×124px, lá lưới ≥44×44px; bàn phím: Tab qua lưới
      bỏ đúng qua các lá đã bốc (không còn trong tab order); reduced-motion
      qua Playwright context `reducedMotion:"reduce"` thật — không tilt,
      panel hiện ngay không cần chờ animation
- [x] Gates green (lint / typecheck / build)
- [x] Verify bằng route tạm `dev-mint-token` (vẫn còn từ phiên trước) — xác
      nhận toàn bộ luồng deal→pick→fly→tab-switch→"Đọc sâu" hoạt động đúng
      tới điểm chạm `ANTHROPIC_API_KEY` (chặn đã biết, không phải do task
      này)
- [ ] Learnings extracted — chờ tới khi Revision 2 xong (learning thật nằm
      ở đó: vì sao `layout`/`layoutId` không phù hợp cho N lớn)

## Checklist — Revision 2 (absolute-position + transform, tham khảo đối thủ)
> Xem "Revision 2" trong `implementation-plan.md` — chẩn đoán kỹ thuật đầy
> đủ + tham chiếu `src_template/tarot/boitarot.com.vn/wp-content/plugins/
> boi-tarot-chuyen-sau/assets/js/boi-tarot-chuyen-sau32aa.js`.
- [x] `CardSpreadPicker.tsx`: `DeckArea` container `position:relative`
      chiều cao cố định theo breakpoint (thay `DealGrid` CSS Grid)
- [x] `computeDeckSlots(count, width, ...)`: hàm thuần tính `{left, top, rotate}`,
      ép `overlapStep` cố định (không chỉ co giãn khi tràn khung) — xem
      "2 bug thật phát hiện lúc verify" ở Progress Log, đã sửa 2 lần
- [x] Lá trong deck: `motion.div` absolute, animate `x/y` (transform) từ
      gốc bộ bài, KHÔNG có `layout`/`layoutId` prop nào
- [x] Bốc lá: animate tại chỗ (đổi target toạ độ) sang 1 trong 3 ô bàn —
      toạ độ cố định TRONG cùng container, không unmount/remount, không
      `layoutId`
- [x] Flip mặt: tái dùng khối `rotateY` 3D + đường reduced-motion cross-fade
      từ `FlipCard` (`ReadingStage.tsx`)
- [x] `DescriptionPanel` + chuyển đổi lá đang xem — giữ nguyên nội dung,
      đổi thành nút `aria-pressed` thay vì `role="tab"` (xem Deviations)
- [x] Verify không-reflow: đo `getBoundingClientRect()` 23 lá còn lại ngay
      sau khi bốc 1 lá qua Playwright — `unexpectedShift: 0/23`, xác nhận
      hết reflow-thừa
- [x] Cảm nhận mượt/đẹp qua ảnh chụp Playwright thật (không chỉ đo số) —
      trải bài giờ có overlap ngang trong hàng + so le giữa 2 hàng, đúng
      dáng "trải bài xoè", không còn như lưới. **Bạn nên tự bấm thử 1 lần
      trên trình duyệt thật để xác nhận cảm quan cuối — Playwright chỉ đo
      được vị trí/hình ảnh tĩnh, không đo được "mượt" theo cảm giác tay.**
- [x] Responsive 375/1280, cả 2 theme (dark verify đầy đủ qua ảnh chụp;
      light chỉ verify bằng đọc code — toàn bộ màu dùng `var(--color-*)`
      token, không có giá trị cứng nào theo theme, xem Deviations), reduced-motion,
      bàn phím
- [x] Gates green (lint / typecheck / build)
- [ ] Learnings extracted

## Progress Log
> `/execute` appends one line per checkpoint.
- 2026-08-19 — Revision 1 hoàn thành, qua hết gate + verify Playwright,
  nhưng user test tay thật thấy "xấu và lag". Đọc mã nguồn đối thủ
  (`src_template/`) để tham khảo kỹ thuật animate, chẩn đoán root cause
  (Framer `layout`/`layoutId` trên 24 phần tử CSS Grid gây reflow thừa mỗi
  lần pick), viết Revision 2 trong `implementation-plan.md`.
- 2026-08-19 — User duyệt ("ok"). Viết lại `CardSpreadPicker.tsx` theo
  Revision 2 (absolute-position + transform x/y, không `layout`/`layoutId`).
  Gates lint/typecheck/build xanh ngay lần đầu.
- 2026-08-19 — Verify Playwright lần 1 phát hiện **2 bug thật, không phải
  do kế hoạch sai mà do lần viết code đầu tiên hiện thực plan chưa tới**:
  (1) `containerWidth` đo bằng `window.innerWidth` thay vì bề rộng thật của
  cột lưới `md:grid-cols-[1fr_320px]` — khung trải bài rộng hơn cột "1fr"
  thật, đẩy `DescriptionPanel` tràn ra ngoài `max-w-5xl` của trang (thấy rõ
  qua ảnh chụp: chữ mô tả bị cắt sát mép phải màn hình). Sửa: đo bằng
  `useLayoutEffect` + `ref.clientWidth` của chính cột chứa deck, không suy
  từ viewport. (2) Overlap ngang giữa các lá trong hàng tính theo công thức
  "chỉ co giãn khi tràn khung" (giống hệt bản gốc trước Revision 2 định
  tránh) → khi 12 lá/hàng còn dư nhiều chỗ, step co giãn về full cardW,
  nhìn y hệt lưới đều — không đạt yêu cầu gốc "xếp đè 1 chút lên nhau" của
  user. Sửa: ép `overlapStep` cố định (~82% cardW) bất kể còn dư chỗ hay
  không.
- 2026-08-19 — Sửa xong bug (2), thử tăng đè DỌC giữa 2 hàng lên 50% chiều
  cao lá cho "xoè" mạnh hơn — verify Playwright phát hiện **bug thật thứ
  3**: hộp `motion.div` của lá hàng dưới là hình chữ nhật đầy đủ (không cắt
  theo hình lá xoay), khi đè dọc 50% nó phủ kín vùng click của lá hàng
  trên bị che — Playwright báo `locator.click` bị "intercept". Đây là giới
  hạn thật của cách dựng UI bằng các hộp chữ nhật absolute chồng nhau, không
  phải lỗi test. Sửa: bỏ hẳn đè dọc giữa 2 hàng (chỉ cách nhau 1 khoảng gap
  `--space-2`), giữ đè ngang trong hàng (đã ép `overlapStep>=44px` để luôn
  còn dải lộ ra ≥44px của lá bị che — touch target, accessibility.md).
  Verify lại: `unexpectedShift: 0/23`, ảnh chụp xác nhận trải bài trông
  giống bài thật xoè nhẹ, không còn như lưới. 10 tài khoản test đã tạo qua
  `verify-picker3-1787130010496@example.com` v.v. — đã xoá sạch, xác nhận
  `count(*) = 0`.

## Checklist — Revision 3 (tham chiếu trực tiếp boitarot.com.vn/boi-tarot/)
> User vẫn thấy "xấu quá" sau Revision 2, chỉ đích danh trang tham khảo
> thật (không phải mirror tĩnh trong `src_template/` — đọc trực tiếp
> `tarot-reader.css`/`tarot-reader.js` LIVE của họ qua curl, vì mirror cũ
> hoá ra là 1 plugin KHÁC (`boi-tarot-chuyen-sau`, 1 lá) không phải plugin
> đang chạy ở URL user đưa (`tarot-reader`, 3 lá, N=78)). Yêu cầu "giống
> hệt" — xem chẩn đoán kỹ thuật đầy đủ trong `implementation-plan.md`
> §Revision 3.
- [x] Đọc trực tiếp CSS/JS live của đối thủ (không chỉ mirror cũ) — phát
      hiện kỹ thuật thật: `.deck-card{position:absolute;transition:left .8s
      cubic-bezier(.22,.61,.36,1), top .8s...}`, lá kích thước CỐ ĐỊNH
      86×130px mọi breakpoint, `targetStep:54` (≈63% cardW, đè ~37%), fly
      bằng NODE CLONE riêng (không tái dùng phần tử deck), flip trễ 900ms
      sau khi bay
- [x] Viết lại `CardSpreadPicker.tsx`: bỏ hẳn Framer `motion.div`, dùng
      `left`/`top` CSS transition thật (không phải transform x/y) trên các
      nút `position:absolute` — đúng kỹ thuật đối thủ, vẫn an toàn reflow vì
      mọi phần tử độc lập tuyệt đối với nhau
- [x] `computeDeckSlots`: `targetStep = cardW*0.63` (tỉ lệ đúng đối thủ),
      SỐ HÀNG tính động theo bề rộng thật (không ép cứng `rows:2` như đối
      thủ — họ có 78 lá + không ràng buộc touch target, mình có N=24 mặc
      định + touch target ≥44px là gate cứng, xem bug đã sửa bên dưới)
- [x] Bốc lá: fly-card THẬT (state riêng `flying[]`, không tái dùng phần tử
      deck) — bắt vị trí xuất phát bằng `getBoundingClientRect()` ngay lúc
      bấm (đúng kỹ thuật `vpRect` của đối thủ, xử lý đúng cả trường hợp bấm
      giữa lúc đang trải)
- [x] Gates green (lint / typecheck / build)
- [x] Verify không-reflow lại từ đầu: `unexpectedShift: 0/23`
- [x] Verify bằng ảnh chụp Playwright, đối chiếu trực tiếp cạnh ảnh chụp
      THẬT của `boitarot.com.vn/boi-tarot/` (không chỉ tự đánh giá) — mật độ
      đè, dáng 2 hàng, cỡ lá bàn lớn hơn cỡ lá bộ bài đều khớp
- [x] Reduced-motion: lá hiện ngay ở vị trí cuối, không stagger, không
      rotateY — cross-fade thay thế (bắt buộc theo accessibility.md, đối
      thủ KHÔNG có đường này — deviation có chủ đích, không phải sót)
- [x] Responsive 375/1280, không cuộn ngang cả 2 mốc

## Bug thật phát hiện + sửa ở Revision 3
- **Ép cứng `rows:2` theo đúng đối thủ → tràn ngang thật ở 375px**
  (Playwright: `scrollWidth 558 > clientWidth 375`). Đối thủ ép cứng 2 hàng
  an toàn với họ vì 78 lá + không có ngưỡng touch target nào ràng buộc. Với
  N=24 (mặc định `env.DEEP_SPREAD_SLOTS`) + touch target ≥44px (gate cứng,
  accessibility.md), 12 lá/hàng ở màn 375px không thể giữ step≥44px trong
  bề rộng đó. Sửa: khôi phục cách tính SỐ HÀNG ĐỘNG theo bề rộng thật (từ
  Revision 2), chỉ giữ lại tỉ lệ đè `cardW*0.63` của đối thủ cho phần mật
  độ — điểm khác biệt kỹ thuật bắt buộc với "giống hệt", không phải chưa cố
  bám sát.

## Checklist — Revision 4 (tối ưu: khựng, mượt, panel neo phải, chủ đề/câu hỏi)
> User phản hồi sau khi tự bấm thử Revision 3: "chọn bài đang bị khựng",
> "bài được chọn move chưa mượt", muốn panel thành popup neo cố định bên
> phải màn hình (không cuộn theo trang), vẫn phải hiện chủ đề+câu hỏi, và
> bố cục lại tổng thể.
- [x] **Chẩn đoán "khựng" bằng số đo thật** (không đoán): Playwright đo
      được ~570ms từ lúc bấm tới khi có chuyển động hình ảnh đầu tiên —
      toàn bộ thời gian đó UI không phản hồi gì ngoài "..." tĩnh, vì animation
      chỉ bắt đầu SAU KHI `/api/reading/deep/reveal` trả lời. Sửa: thêm phản
      hồi tức thì (<100ms, đo lại còn ~60-85ms) NGAY khi bấm — lá nhấc lên
      nhẹ (translateY -6px, scale 1.05, brightness 1.15) + spinner xoay,
      không chờ mạng
- [x] **Chẩn đoán "chưa mượt"**: lấy mẫu vị trí lá bay mỗi 30ms trong lúc
      bay — nội suy CSS mượt thật (không giật khung), nhưng bug thật là
      **lật mặt (`flip`) bắt đầu TRƯỚC KHI bay xong** (Revision 3: flip
      trễ cố định 900ms trong khi bay mất 1000ms → 2 animation chồng lấn
      100ms cuối). Sửa: flip giờ chỉ bắt đầu SAU khi bay đã tới nơi hẳn
      (`40ms trigger + FLY_MS + 30ms đệm`, tính từ FLY_MS thật chứ không
      phải số đoán độc lập). Rút ngắn toàn bộ timing cho cảm giác nhanh
      nhẹ hơn: DEAL 800→620ms, stagger 56→38ms, FLY 1000→620ms, FLIP
      800→420ms
- [x] Panel đổi từ cột grid (`md:grid-cols-[1fr_320px]`, cuộn theo trang)
      sang `position:fixed` neo phải ở ≥768px (`top` = space-8+space-5,
      `right` = space-6, rộng 320px, `max-height` + `overflow-y:auto` để
      không tràn quá viewport) — không cuộn theo trang nữa. Giữ nguyên tĩnh
      cuối trang ở <768px (không đổi quyết định mobile đã chốt trước)
- [x] Panel LUÔN hiện từ lúc bắt đầu bốc lá (không chờ có lá active nữa) —
      hiện chủ đề (`TOPIC_LABEL[topic]`) + nguyên văn câu hỏi user đã nhập
      ở đầu panel, cố định; phần mô tả lá + nút Đọc sâu nằm dưới, đổi theo
      lá đang xem. Trạng thái rỗng ("Bốc 1 lá bất kỳ để xem mô tả ở đây.")
      khi chưa bốc lá nào — đủ 4 trạng thái theo code-style.md
- [x] `DeepReadingStage.tsx`: thêm `topic`/`question` vào stage `picking`,
      truyền xuống `CardSpreadPicker`
- [x] Bố cục lại: khu bốc lá full-width (bỏ grid 2 cột), chừa
      `md:pr-[352px]` để không bị panel neo phải đè lên
- [x] Gates green (lint / typecheck / build)

## Bug thật phát hiện + sửa ở Revision 4
- **`md:w-80` không áp dụng gì cả — panel tràn full-width, chữ bị cắt sát
  mép trái.** Đúng y hệt loại lỗi đã ghi ở Learned Patterns của
  `.claude/rules/project.md` (2026-08-16, `--spacing-0` bị thiếu): file
  này set `--spacing-*: initial` trong `globals.css` rồi chỉ định nghĩa lại
  10 bước (`--spacing-0` tới `--spacing-8`, khớp ramp 4/8/12/16/24/32/48/64).
  `w-80` map sang bước "80" — không tồn tại trong ramp này (khác Tailwind
  mặc định) — nên sinh CSS rỗng, im lặng không báo lỗi. Sửa: `md:w-[320px]`
  (giá trị arbitrary tuyệt đối, không qua thang spacing). **Bài học: KHÔNG
  BAO GIỜ dùng utility spacing/width/height bare-number (`w-80`, `mt-96`...)
  trong dự án này — chỉ dùng số trong ramp 1-8 hoặc giá trị arbitrary
  `[...]`.**
- Đồng thời sửa cú pháp `calc()` trong 2 class arbitrary khác (thiếu
  khoảng trắng quanh `+`/`-` — CSS spec yêu cầu, Tailwind bracket-value
  cần viết `_+_`/`_-_` thay dấu cách) — phòng ngừa, dù đo được Chromium vẫn
  chạy đúng `top` dù thiếu khoảng trắng.

## Checklist — Revision 5 (bố cục 70/30 → 50% khi đủ 3 lá, breadcrumb lên topbar)
- [x] Khu trải bài "phá khung" khỏi `max-w-5xl`, chiếm phần còn lại của MÀN
      HÌNH (không phải cột nội dung) sau khi trừ panel — giữ nguyên mép
      trái (thẳng hàng header), chỉ nới mép phải. Đo bằng `window.innerWidth`
      + `getBoundingClientRect().left`, 1 lần lúc mount
- [x] Panel ngữ cảnh: 30% màn hình lúc đang bốc (`clamp(280,30vw,480)`),
      tự nở lên 50% (`clamp(360,50vw,720)`) khi đủ 3 lá — verify đo trực
      tiếp: 432px→720px ở viewport 1440px, khớp công thức
  - Khu trải bài KHÔNG co lại khi panel nở — panel đè lên (yêu cầu rõ
    "có thể đè lên đống bài"), xác nhận qua ảnh chụp (lá thứ 3 bị panel
    che 1 phần)
  - Sửa z-index: bản trước dùng số tuỳ tiện (1000+) cho lá bay — cao hơn cả
    token `--z-overlay`(300) panel đang dùng, panel sẽ KHÔNG đè lên được.
    Đưa toàn bộ ngăn xếp cục bộ của deck xuống dưới 50, panel dùng đúng
    token `--z-overlay`
- [x] Breadcrumb "Trang chủ › Đọc sâu" chuyển vào topbar ở ≥768px qua
      `HeaderBreadcrumbSlot` (React portal, `Header` là Server Component
      không thể biết breadcrumb của từng route). Giữ nguyên tại chỗ ở
      <768px — thử portal luôn cả mobile trước, phát hiện bug thật (logo
      tự xuống dòng 3 tầng vì header không đủ chỗ cho 3 nhóm nav trên 1
      hàng ở 375px), sửa bằng cách chỉ portal ở `md:`
- [x] Gates green (lint / typecheck / build) — gặp 1 lỗi React Compiler mới
      (`react-hooks/set-state-in-effect`), xem bug log
- [x] Không còn console error/warning nào khi verify qua Playwright
      (desktop + mobile) — bắt được thêm 1 bug thật ngoài lề (xem dưới)

## Bug thật phát hiện + sửa ở Revision 5
- **`react-hooks/set-state-in-effect` (React Compiler) chặn build khi gộp
  nhiều setState riêng lẻ trong 1 effect.** Không phải do "setState trong
  effect" nói chung (nhiều chỗ khác trong file vẫn qua được) — cụ thể là 5
  `useState` riêng biệt cùng được set trong 1 `useLayoutEffect`. Sửa bằng
  gộp thành 1 state object, 1 lần setState mỗi nhánh. `HeaderBreadcrumbSlot`
  gặp lại đúng lỗi này dù chỉ có 1 setState — hoá ra rule này không chấp
  nhận BẤT KỲ setState nào set 1 giá trị đọc trực tiếp từ DOM/external
  trong effect, kể cả khi có guard `if`. Sửa đúng cách theo đề xuất #3
  ngay trong thông báo lỗi: dùng `useSyncExternalStore` thay vì
  `useEffect`+`setState` cho việc đọc 1 giá trị bên ngoài React (ở đây là
  DOM node của slot) — đây là API dành riêng cho đúng use case này.
- **`Image fill` với parent `position:static`** — lớp `<div>` trong cùng
  của lá trong bộ bài (thêm ở Revision 4 để tách hiệu ứng "nhấc lên" khỏi
  transition vị trí) thiếu `position:relative`, Next.js cảnh báo console
  (không crash, nhưng ảnh có thể render sai kích thước). Phát hiện qua đọc
  kỹ dev server log (`tail /private/tmp/tarot-dev.log`), không phải qua
  ảnh chụp — bug loại này không luôn hiện rõ trên ảnh tĩnh. Sửa: thêm
  `relative` vào className.
- **Hydration mismatch PHÁT HIỆN nhưng KHÔNG PHẢI do phiên này** — cảnh báo
  React về `style={{border, background}}` (shorthand) trong
  `DeepQuestionForm.tsx`'s `<textarea>`. Xác nhận qua `git log`: file này
  chưa đụng tới trong toàn bộ phiên (commit gần nhất `489b9be`, "phase 4b",
  2026-08-18), không phải lỗi tôi gây ra. Cảnh báo, không chặn (React tự
  "vá" bằng giá trị client, không crash) — **để lại cho lần khác, ngoài
  phạm vi yêu cầu hôm nay**, ghi lại đây để không quên.

## Checklist — Revision 6 (lệch trái hơn, không để panel che 3 lá đã chọn)
- [x] Mép trái khu trải bài kéo sát mép trái MÀN HÌNH thật (chỉ chừa đúng 1
      khoảng gap — `--space-6`, đối xứng với gap panel đang chừa bên phải)
      thay vì thẳng hàng với header/breadcrumb như Revision 5 — verify đo:
      deckLeft = logoLeft = 32px
- [x] 3 ô "bàn" (lá đã bốc) KHÔNG BAO GIỜ bị panel che, kể cả lúc panel nở
      50% — khác với đống bài chưa bốc (panel đè lên đống đó vẫn là chủ ý,
      không đổi). Cơ chế: bề rộng dùng để CĂN GIỮA 3 ô bàn tự trừ đi đúng
      phần panel-mở-rộng-thêm khi `allRevealed`, khiến 3 lá tự dịch trái —
      tận dụng lại đúng cơ chế CSS transition trên `left` đã có sẵn (không
      cần thêm state/animation mới): đổi `target` phản ứng theo
      `allRevealed` → trình duyệt tự nội suy sang vị trí mới, đúng tinh
      thần "layout lại khi chọn đủ 3 lá để cân bằng thị giác" user gợi ý,
      không cần dựng hẳn 1 "chế độ kết quả" riêng
- [x] Verify đo trực tiếp: right-edge của cả 3 lá bàn (277/426/575) đều nhỏ
      hơn left-edge của panel đã nở (688) ở viewport 1440px
- [x] Gates green, không console error/warning, không tràn ngang 375px lẫn
      1440px, không reflow thừa ở mobile khi bốc lá (0/23)

## Checklist — Revision 7 (chữ hiện lần lượt trong panel giải thích)
- [x] `RevealText`: đoạn mô tả lá bài (`activeCard.base.body`) hiện theo
      từng từ, stagger — remount qua `key={cardId+orientation}` mỗi lần đổi
      lá đang xem để kích hoạt lại animation (Framer chỉ chạy
      `initial→animate` lúc mount, không phải mỗi khi prop đổi)
- [x] Tổng thời gian chạy CỐ ĐỊNH (~700ms+260ms) bất kể đoạn văn dài/ngắn —
      chia đều delay cho số từ, chặn trên mỗi từ 30ms — lá mô tả dài
      (~200 từ) không kéo animation dài cả chục giây
- [x] Reduced-motion: hiện toàn văn ngay, không tách từ/không animate —
      verify: đúng full text, `hasSpans:false`
- [x] Accessibility: bản hiện `aria-hidden` (tách nhiều `<span>` có thể làm
      trình đọc màn hình đọc rời rạc) + 1 bản `sr-only` đầy đủ hiện ngay
      lập tức song song, không phải chờ animation chạy xong mới đọc được —
      verify: sr-only text length khớp đoạn văn gốc
- [x] Verify bằng số đo thật (không chỉ nhìn ảnh): lấy mẫu opacity mỗi
      60ms — từ #0 đạt full trước từ #30 rõ rệt (0.49 vs 0.01 ở cùng thời
      điểm), xác nhận có stagger thật, không phải hiện đồng loạt
- [x] Gates green, không console error/warning mới nào

## Open Questions
- Không còn — chờ bạn tự bấm thử trên trình duyệt thật để xác nhận cảm
  quan cuối cùng (Playwright đo được vị trí/pixel/opacity/console sạch,
  nhưng cảm quan cuối vẫn là của bạn).
- `DeepQuestionForm.tsx` có hydration mismatch nhẹ, không liên quan tới
  công việc hôm nay — nêu ở Revision 5, chưa sửa.
