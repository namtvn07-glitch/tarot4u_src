# Redesign animation + UX cho bước chọn lá (Giai đoạn 4c)

Bước chọn lá hiện tại (`CardSpreadPicker.tsx`) là 1 lưới N=24 nút tĩnh, bấm
là hiện ngay danh sách lá đã lộ dạng cột dọc bên dưới. User muốn animation
"trải bài" thật (lá bay ra từ bộ bài), khu "mặt bàn" riêng cho lá đã bốc,
panel mô tả bên phải/cuối trang thay cho danh sách dọc, và giữ nguyên khu
này khi Đọc sâu chạy thay vì unmount hoàn toàn như hiện tại.

## Decisions Needed From You
> [!IMPORTANT]
> - **Cách "trải bài" cho N=24 lá**: lưới responsive nhiều hàng (như hiện
>   tại) + animation lá bay vào từ 1 điểm gốc (stagger), overlap dọc nhẹ
>   trong từng hàng — **không** phải 1 dải hình quạt (fan) thật cho cả 24 lá
>   (không đứng vững ở 375px: 24 lá overlap ngang cần bề rộng rất lớn hoặc
>   lá rất nhỏ, phá touch target 44px). Đồng ý cách này, hay bạn hình dung
>   "trải bài" khác (vd: cuộn ngang 1 hàng dài, xem thêm ở "Considered and
>   rejected")?
> - **Panel mô tả ở ≥768px: sticky (dính lại khi cuộn) hay nằm cố định trong
>   luồng (cuộn theo trang)?** Đề xuất **không sticky** (đơn giản hơn, ít rủi
>   ro CSS hơn, nội dung panel không dài nên không cần "theo dõi" khi cuộn).

## Approach
`CardSpreadPicker.tsx` viết lại thành 3 phần trong cùng file (tightly-coupled,
theo code-style.md — không tách file trừ khi >150 dòng riêng lẻ):
1. **`DealGrid`** — lưới N lá úp, mỗi lá là `motion.button` với `layoutId`
   riêng (`slot-${i}`). Lúc mount, cả lưới animate từ 1 "deck origin" (một
   điểm cố định, ví dụ giữa-trên khu vực) bằng `initial={{ scale: 0.3, opacity: 0, x: originX, y: originY }}` → `animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}`,
   `transition={{ delay: i * 0.02, duration: motionMs('--motion-draw')/1000 }}`
   — dùng token `--motion-draw` (400ms) đã có, không thêm token mới. Overlap
   "đè nhẹ" bằng `marginTop: -8px` giữa các hàng (arbitrary value nhỏ, không
   thuộc ramp spacing — comment lý do theo design-system.md "single
   exception").
2. **`Table`** — 3 ô cố định phía trên `DealGrid`. Khi bốc 1 lá, dùng
   Framer Motion **shared layout animation**: lá được bốc đổi `layoutId` từ
   `slot-${i}` sang `table-${revealIndex}` — Framer Motion tự nội suy vị trí
   bay từ ô lưới sang ô bàn (`AnimatePresence` + `layout` prop), kèm flip
   giống `FlipCard` (4b) để lộ mặt trước đúng lúc bay tới. Mỗi ô bàn là
   `<button role="tab">`, `aria-selected` = có phải lá đang active trong
   panel không.
3. **`DescriptionPanel`** — hiện thông tin lá `active` (mặc định = lá vừa
   bốc gần nhất). Layout: `grid-cols-[1fr] md:grid-cols-[1fr_320px]` cho
   toàn bộ `CardSpreadPicker` — panel là cột thứ 2 ở `md:`+ trở lên, xuống
   hàng dưới ở <768px (chỉ CSS Grid, không cần JS đổi cấu trúc DOM). Nút
   "Đọc sâu cho câu hỏi của bạn" nằm cuối panel, hiện khi
   `revealed.length === 3 && !deepReadingStarted`.

`DeepReadingStage.tsx`: gộp `picking`/`personal` — thay vì 2 stage loại trừ
nhau, dùng 1 stage `picking` mang thêm field `deepReadingStarted: boolean`.
`onDeepReading` không còn chuyển stage mà chỉ set field này `true`.
`CardSpreadPicker` nhận prop `deepReadingStarted` để ẩn nút; `<DeepResultStream>`
render **thêm vào sau** `CardSpreadPicker` (không thay thế) khi field này true.

**Considered and rejected**
- *True fan hình quạt cho cả 24 lá (overlap ngang, xoay góc như bài thật)* —
  đẹp hơn về mặt hình ảnh nhưng không scale được xuống 375px: 24 lá cần bề
  rộng rất lớn hoặc kích thước lá quá nhỏ (phá 44px touch target,
  accessibility.md gate cứng). Loại vì vi phạm gate không thể thương lượng.
- *Cuộn ngang 1 hàng dài 24 lá kiểu carousel* — giữ được cảm giác "1 dải
  bài" hơn lưới nhiều hàng, nhưng thêm phức tạp (cuộn bằng chuột/touch,
  snap-scroll, chỉ báo còn bao nhiêu lá ngoài khung nhìn) cho một khu vực
  chỉ dùng 1 lần mỗi lượt Đọc sâu — chi phí không tương xứng lợi ích. Nêu ở
  Decisions Needed để bạn chọn nếu muốn đổi hướng.
- *Panel mô tả dạng modal/dialog nổi* — đã loại qua AskUserQuestion (panel
  trong luồng trang đơn giản hơn về a11y — không cần focus-trap/Esc-to-close).
- *Mỗi lá có popup mở/đóng riêng* — đã loại qua AskUserQuestion (chọn "panel
  cập nhật theo lá đang chọn" để xem được cả 3 mô tả trước khi quyết định).

## Proposed Changes

### Components
#### [MODIFY] `src/components/reading/CardSpreadPicker.tsx`
Viết lại gần như toàn bộ, giữ nguyên:
- Props đầu vào (`token`, `slots`) — **thêm** `deepReadingStarted: boolean`
- Logic gọi `POST /api/reading/deep/reveal` (không đổi)
- `onDeepReading` callback — đổi ý nghĩa từ "chuyển stage" thành "báo lên
  cha là đã bấm nút" (cha tự set `deepReadingStarted`)

Cấu trúc JSX mới (khối ngoài cùng, layout 2 cột ở `md:`):
```tsx
<div className="grid gap-6 md:grid-cols-[1fr_320px]">
  <div>
    <Table revealed={revealed} activeIndex={activeIndex} onSelect={setActiveIndex} />
    <DealGrid slots={slots} pickedSlots={pickedSlots} onPick={handlePick}
              loadingSlot={loadingSlot} reducedMotion={!!reducedMotion} />
    {error && <p role="alert" ...>{error}</p>}
  </div>
  {revealed.length > 0 && (
    <DescriptionPanel
      card={revealed[activeIndex ?? revealed.length - 1]}
      allRevealed={revealed.length >= 3}
      deepReadingStarted={deepReadingStarted}
      onDeepReading={onDeepReading}
    />
  )}
</div>
```
`activeIndex` (state mới, `number | null`) tự set = `revealed.length - 1`
mỗi khi có lá mới bốc (trong `handlePick`, sau `setRevealed`), user bấm lá
khác trên `Table` để đổi.

#### [MODIFY] `src/components/reading/DeepReadingStage.tsx`
```tsx
type Stage =
  | { name: "question" }
  | { name: "shuffling" }
  | { name: "picking"; token: string; slots: number; deepReadingStarted: boolean } // + field mới
  | { name: "blocked"; category: BlockedCategory }
  | { name: "error"; message: string };
// bỏ variant "personal" — gộp vào "picking"
```
```tsx
{stage.name === "picking" && (
  <>
    <CardSpreadPicker
      token={stage.token}
      slots={stage.slots}
      deepReadingStarted={stage.deepReadingStarted}
      onDeepReading={() => setStage({ ...stage, deepReadingStarted: true })}
    />
    {stage.deepReadingStarted && <DeepResultStream token={stage.token} />}
  </>
)}
```

### Content
- Không cần copy mới — toàn bộ text (nhãn nút, thông báo lỗi, aria-label)
  giữ nguyên nguyên văn từ bản hiện tại.

## Accessibility Plan
- **3 ô "mặt bàn"** dùng pattern tab: container `role="tablist"
  aria-label="3 lá đã bốc"`, mỗi ô `role="tab" aria-selected={i === activeIndex}`,
  `DescriptionPanel` là `role="tabpanel"`. Đây là tương tác chọn-1-trong-nhiều
  đã có nội dung sẵn (không phải async), đúng semantic hơn `aria-live`.
- **Lưới N lá úp**: giữ nguyên `role="group"` + mỗi lá `<button>` với
  `aria-label` như hiện tại — không đổi, chỉ thêm animation.
- **Focus**: khi lá đầu tiên được bốc (panel xuất hiện lần đầu), **không**
  tự chuyển focus (user vẫn đang ở nút lá vừa bấm trong lưới — chuyển focus
  đột ngột sẽ mất ngữ cảnh). Khi bấm 1 tab trên `Table` để đổi lá xem, giữ
  focus tại tab đó (hành vi mặc định của `<button>`, không cần xử lý thêm).
- **Reduced-motion**: `DealGrid` bỏ animation stagger/scale (`reducedMotion`
  → `initial=animate`, hiện ngay); `Table` bỏ shared-layout fly, chỉ
  cross-fade khi lá xuất hiện ở ô bàn — cùng pattern `FlipCard` (4b).
- **Touch target**: mỗi lá trong `DealGrid` giữ `min-h-[44px] min-w-[44px]`
  hiện có; 3 ô `Table` cũng ≥44px (kích thước lá thật ~72×124px theo
  `RevealedCardPanel` cũ, thừa yêu cầu).
- **Contrast**: không màu mới, dùng token có sẵn (`--color-border`,
  `--color-surface-raised`, `--color-danger`...) — đã pass ở
  `contrast-audit.md`.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `CardSpreadPicker.tsx` | Chỉ `DeepReadingStage.tsx` (1 call site, xác nhận qua grep) | Thấp — không component nào khác import file này |
| `DeepReadingStage.tsx` | Chỉ `src/app/doc-sau/page.tsx` | Thấp — route riêng của 4c, không ảnh hưởng `/trai-bai` (4b) hay bất kỳ route nào khác |
| Props `onDeepReading` đổi ý nghĩa | Chỉ nội bộ 2 file trên | Không ảnh hưởng ngoài — không phải shared primitive |

## Verification Plan
### Automated
```
pnpm lint
npx tsc --noEmit
pnpm build
```

### Manual
1. Vì `ANTHROPIC_API_KEY` vẫn chưa hợp lệ (xem `phase-4c-doc-sau/task.md`
   Open Questions), verify qua route tạm `dev-mint-token` (đã tạo ở phiên
   trước để bỏ qua bước kiểm duyệt) — **không xoá route này trước khi hoàn
   thành task hiện tại**, xoá cùng lúc khi cả 2 task 4c đóng hẳn.
2. Trải bài: 24 lá animate vào đúng thứ tự, không giật, đường reduced-motion
   verify bằng Playwright context `reducedMotion:"reduce"` thật.
3. Bốc 3 lá lần lượt: lá bay đúng từ vị trí lưới sang đúng ô bàn còn trống,
   flip lộ mặt trước đúng lúc.
4. Bấm qua lại 3 tab trên bàn: panel đổi nội dung đúng, `aria-selected`
   đúng lá đang active.
5. Bấm "Đọc sâu": nút biến mất, `DeepResultStream` xuất hiện NGAY DƯỚI khu
   bàn+panel (không thay thế) — cuộn lên vẫn thấy 3 lá + mô tả.
6. 375/768/1280/1920, cả 2 theme.
7. Bàn phím: Tab qua đủ lưới → 3 tab bàn → panel → nút Đọc sâu, không bẫy
   focus ở đâu.

## Out of Scope
- Animation cho `DeepQuestionForm` (màn hỏi câu hỏi) — không đổi.
- Sticky panel khi cuộn — trừ khi bạn chọn khác ở Decisions Needed.
- Cuộn ngang kiểu carousel cho lưới 24 lá — trừ khi bạn chọn khác ở Decisions Needed.

---

## Revision 2 (2026-08-19) — Fix "xấu và lag", tham khảo đối thủ

Bản build đầu (Revision 1, ở trên) đã qua hết gate lint/typecheck/build và
verify Playwright, nhưng bạn test bằng mắt/tay thật thì thấy **giao diện
trải bài xấu và lag**. Root cause + hướng sửa dưới đây, có tham khảo trực
tiếp mã nguồn animation của đối thủ (`src_template/tarot/boitarot.com.vn/
wp-content/plugins/boi-tarot-chuyen-sau/assets/js/*.js` — module "Bói Tarot
Chuyên Sâu", cùng loại tính năng "1 lá + luận giải sâu" gần nhất với
`/doc-sau` của mình).

### Vì sao lag — chẩn đoán kỹ thuật

`DealGrid` hiện tại đặt 24 `motion.button` vào **CSS Grid thật**
(`grid-cols-6 sm:grid-cols-8`) và bật `layout` + `layoutId` trên **tất cả**.
Framer Motion `layout`/`layoutId` hoạt động bằng kỹ thuật FLIP: mỗi lần
re-render, nó phải **đo lại bounding box của toàn bộ phần tử đang bật
`layout`** để nội suy vị trí cũ→mới. Khi bốc 1 lá, state đổi → React
re-render → Framer đo lại **23 nút còn lại cộng thêm ô bàn** cùng lúc, dù
23 nút đó không hề di chuyển — đây là phần việc thừa gây giật. Cộng thêm:
`marginTop`/`gap-y-1` âm nhỏ giữa các hàng khiến layout co giãn theo nội
dung ảnh tải xong, làm reflow thêm một lần nữa ở lần đầu mount.

`ReadingStage.tsx` (Giai đoạn 4b, đã verify mượt) **không hề dùng
`layout`/`layoutId`** — `GhostDeck`/`FlipCard` chỉ animate `x`/`y`/`rotate`
(transform, chạy trên GPU compositor, không đụng layout engine) trên các
`div` `position: absolute` bên trong 1 container `position: relative` kích
thước cố định. Đây chính là lý do 4b mượt còn `CardSpreadPicker` giật —
không phải do số lượng lá (24 vs 3), mà do **kỹ thuật animate khác hẳn
nhau**.

### Vì sao xấu

`DealGrid` hiện tại là lưới đều tăm tắp (Grid 6/8 cột, gap nhỏ) — không
thật sự "trải" hay "xếp đè lên nhau" như bạn mô tả ban đầu, chỉ là 24 ô
vuông vức nhấp nháy vào chỗ. Đối thủ tính vị trí bằng công thức xếp chồng
ngang có chủ đích (`computeSlots`/`rowSlots` trong file JS trên): với N lá
trải trên 2 hàng, `step` (khoảng cách tâm giữa 2 lá liền kề) được tính nhỏ
hơn bề rộng lá khi cần để **vừa khít bề rộng khung chứa** — lá liền kề đè
lên nhau đúng như bài thật xoè ra, không phải lưới.

### Đối thủ làm gì (tham khảo, không copy nguyên)

Từ `boi-tarot-chuyen-sau32aa.js`:
1. **Container cố định kích thước** (`#td-deckArea{position:relative;
   height:420px}`), mọi lá là `div.td-card{position:absolute}` bên trong —
   xoá/thêm 1 lá không làm phần tử khác trong container reflow (vì không
   phần tử nào ở luồng bình thường cả).
2. **`computeSlots`**: hàm thuần tính `{left, top}` cho từng lá theo bề
   rộng container hiện tại, chia 2 hàng, `step` co giãn để N lá vừa khít
   → đúng cảm giác "trải bài xoè, đè nhẹ lên nhau" khi N lớn.
3. **`dealSequential`**: set `left/top` từng lá bằng `requestAnimationFrame`
   + `await sleep(40ms)` giữa các lá (dựa vào CSS `transition: left .8s,
   top .8s`, không dùng animate JS-driven) — stagger thật, không phải delay
   trong 1 lần animate.
4. **Bốc lá**: **không** dùng shared-layout giữa 2 hệ layout khác nhau. Nó
   tạo 1 node `div.td-fly` **mới**, đặt `left/top` = vị trí hiện tại của lá
   vừa bấm (đọc từ `getBoundingClientRect`), append vào cùng container
   `position: relative`, rồi đổi `left/top` sang toạ độ đích (1 lần
   `setTimeout` để trigger CSS transition) — bay bằng transform/position,
   flip mặt bằng `rotateY` sau khi bay tới. Node gốc trong lưới bị `remove()`
   ngay lập tức (không cần khớp layout vì đã có node fly thay thế).

### Hướng sửa cho `CardSpreadPicker.tsx` — áp dụng kỹ thuật đã có sẵn trong
### chính codebase (không thêm dependency)

**Không dùng CSS Grid, không dùng `layout`/`layoutId` nữa.** Thay bằng
đúng pattern `GhostDeck`/`FlipCard` đã verify mượt ở 4b — absolute-position
+ transform — kết hợp công thức xếp chồng của đối thủ để có hình ảnh
"trải bài" đúng nghĩa:

1. **`DeckArea`**: 1 `div` `position: relative`, chiều cao cố định theo
   breakpoint (giống `getSizes()` của đối thủ — vài mốc theo
   `window.innerWidth`, không cần `ResizeObserver` liên tục, chỉ đo lại khi
   mount/khi bắt đầu trải — đối thủ cũng chỉ tính 1 lần lúc xào, không theo
   dõi resize runtime, vì user không resize giữa chừng 1 lượt đọc bài).
2. **`computeSlots(width, count)`**: hàm thuần (dễ unit-test bằng tay qua
   Playwright), trả về mảng `{left, top, rotate}` — 2 hàng, `step` co giãn
   để vừa khít bề rộng, lá hàng dưới lệch dọc để "đè" lên hàng trên đúng
   như đối thủ.
3. **Lá trong deck**: `motion.div` `position: absolute`, đặt sẵn `left/top`
   = slot đã tính, animate `x/y` (transform, KHÔNG animate `left/top` trực
   tiếp để tránh reflow — khác đối thủ ở điểm này vì họ dùng CSS transition
   trên `left/top` do không có Framer, nhưng transform vẫn cho đúng hiệu ứng
   và rẻ hơn) từ gốc "bộ bài" (1 điểm cố định, vd góc trên khung) về `0,0`,
   `transition={{delay: i * 20ms, duration: --motion-draw}}` — không có
   `layout` prop nào cả, nên re-render vì pick không đụng tới các lá còn lại.
4. **Bốc 1 lá**: **không unmount/remount qua `layoutId`**. Cùng 1 phần tử
   (không tạo node fly riêng như đối thủ — Framer Motion cho phép animate
   tại chỗ) đổi `animate` target từ toạ độ-trong-deck sang toạ độ-ô-bàn
   (3 ô bàn cũng là toạ độ cố định TRONG CÙNG container `DeckArea`, đặt ở
   hàng trên cùng — tương đương `td-pickedSlot` của đối thủ nằm phía trên
   deck). Vì cả 2 vị trí đều là toạ độ tuyệt đối trong cùng 1 container
   không-reflow, animate transform giữa chúng rẻ và mượt, không cần FLIP.
   Flip mặt dùng lại nguyên khối `rotateY` 3D từ `FlipCard` (đã có,
   reduced-motion-safe).
5. **`DescriptionPanel`**: giữ nguyên như Revision 1 (cột phải/cuối trang,
   tab pattern) — không phải nguồn lag, không đổi kỹ thuật.

### Quyết định đã tự chọn (nêu ra, không hỏi lại vì rủi ro thấp/dễ đổi)
- Không thêm `ResizeObserver` theo dõi resize runtime — tính slot 1 lần khi
  bắt đầu trải, giống đối thủ. Nếu bạn resize cửa sổ giữa chừng, layout giữ
  nguyên tới lần trải kế tiếp (chấp nhận được — không phải luồng thường
  gặp).
- Không tạo "fly node" riêng như đối thủ — animate tại chỗ bằng
  `animate={{x, y}}` transform, đơn giản hơn (ít DOM node hơn), Framer đã
  cho phép animate 1 phần tử di chuyển tự do trong 1 container tuyệt đối mà
  không cần clone.
- Bàn (3 ô đã bốc) chuyển vào **trong** `DeckArea` (toạ độ cố định hàng
  trên), không còn là 1 khối `Table` riêng nằm phía trên bằng CSS Flex như
  Revision 1 — để toàn bộ animation bay ở trong 1 container tuyệt đối
  không-reflow. Tab-switch giữa 3 lá đã bốc (đổi lá active ở panel) vẫn
  hoạt động y hệt — chỉ đổi *nơi* các nút đó được đặt.

### File thay đổi (Revision 2)
| File | Hành động |
|---|---|
| `src/components/reading/CardSpreadPicker.tsx` | Viết lại phần `DealGrid`+`Table` thành `DeckArea` (absolute-position + transform), giữ nguyên `DescriptionPanel` và toàn bộ logic gọi API/props |

### Verification bổ sung
- Cảm nhận bằng mắt/tay thật (không chỉ Playwright): trải bài không giật,
  overlap nhìn giống bài thật xoè ra, bay lên bàn mượt — tự bạn xác nhận
  lại sau khi build xong (Playwright không đo được "mượt"/"đẹp" theo cảm
  quan).
- Playwright: đo `getComputedStyle`/vị trí trước-sau animate để xác nhận
  không có phần tử nào ngoài lá đang animate bị dịch chuyển khi pick (chứng
  minh hết reflow-thừa) — có thể so sánh `getBoundingClientRect()` của các
  lá còn lại trước/sau 1 lần pick, phải giữ nguyên.
- Responsive 375/768/1280, cả 2 theme, reduced-motion, bàn phím — lặp lại
  đúng danh sách đã verify ở Revision 1.

---

## Revision 3 (2026-08-19) — Tham chiếu trực tiếp boitarot.com.vn/boi-tarot/

User vẫn thấy "xấu quá" sau Revision 2, chỉ đích danh trang tham khảo
sống: `https://boitarot.com.vn/boi-tarot/` — muốn animation "giống hệt".

`src_template/` (mirror tĩnh dùng ở Revision 2) hoá ra chụp **plugin khác**
(`boi-tarot-chuyen-sau`, luồng 1-lá) — không phải plugin thật sự chạy ở URL
trên (`tarot-reader`, luồng 3-lá, N=78 lá). Đọc trực tiếp
`tarot-reader.css`/`tarot-reader.js` LIVE (qua `curl`, tìm đúng file qua
`<link id="tarot-reader-css">` trong HTML — không có trong `src_template/`)
mới ra đúng kỹ thuật thật:
- `.deck-card{position:absolute; transition:left .8s cubic-bezier(.22,.61,.36,1),
  top .8s cubic-bezier(.22,.61,.36,1), transform .8s ease}` — animate
  `left`/`top` CSS THẬT (không phải `transform: translate()` như Revision
  2 dùng), an toàn reflow vì mọi lá là `position:absolute` độc lập nhau.
- Lá kích thước CỐ ĐỊNH 86×130px mọi breakpoint; `DEAL_CFG.targetStep:54`
  (≈63% cardW, đè ~37%) — mật độ đè lớn hơn nhiều so với Revision 2
  (`0.82`).
- `DEAL_CFG.rows:2` ép cứng — an toàn với họ vì 78 lá + không ràng buộc
  touch target nào.
- Bốc lá: tạo `.fly-card` **node clone mới** (không tái dùng phần tử deck),
  bắt vị trí xuất phát bằng `getBoundingClientRect()` ngay lúc bấm, đổi
  `left`/`top` sau 40ms (trigger transition), flip `rotateY` sau 900ms.

**Đã port kỹ thuật này vào `CardSpreadPicker.tsx`** — bỏ Framer
`motion.div`, dùng `left`/`top` CSS transition + `getBoundingClientRect()`
+ fly-card độc lập, timing/easing khớp nguyên văn đối thủ (hằng số cục bộ
`DEAL_MS/DEAL_EASE/DEAL_STAGGER_MS/FLY_MS/FLIP_DELAY_MS/FLIP_MS`, không
qua ramp `--motion-*` — comment lý do trong code theo "single exception").

**2 khác biệt bắt buộc, không phải chưa bám sát**:
1. Lá vẫn co giãn theo breakpoint (không cố định 86×130px) — cố định như
   đối thủ sẽ vỡ touch target ở mobile khi N nhỏ hơn nhiều (24 vs 78).
2. Số hàng tính ĐỘNG theo bề rộng thật, không ép cứng `rows:2` — ép cứng
   gây tràn ngang thật ở 375px (bắt được qua Playwright: `scrollWidth 558 >
   clientWidth 375`), vì 12 lá/hàng không giữ nổi step≥44px (touch target,
   accessibility.md — gate cứng) trong bề rộng điện thoại.
3. Giữ đường reduced-motion (đối thủ không có) — accessibility.md bắt
   buộc, không thương lượng theo độ giống.

Xem checklist đầy đủ + ảnh chụp đối chiếu trực tiếp cạnh ảnh chụp thật của
trang tham khảo ở `task.md` §Revision 3.
