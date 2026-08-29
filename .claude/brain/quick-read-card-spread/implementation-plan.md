# Đọc nhanh dùng chung cơ chế trải-bài-chọn-lá với Đọc sâu

Follow-up của `.claude/brain/calestial-redesign` (đã `/execute` xong 5 layer
visual). Lần này là thay đổi UX thật: `ReadingStage.tsx` (Đọc nhanh, `/trai-bai`)
bỏ cơ chế xáo-1-cọc-tự-lật, chuyển sang trải N lá úp cho user tự chọn 1 lá —
đúng cảm giác tương tác của `CardSpreadPicker.tsx` (Đọc sâu, `/doc-sau`), qua
một component lõi tách dùng chung thay vì copy-paste.

## Decisions Needed From You
> [!IMPORTANT]
> - **Kiến trúc dùng chung**: tách phần deck/pick/fly/flip của
>   `CardSpreadPicker.tsx` thành `CardSpread.tsx` dùng chung cho cả 2 luồng,
>   `CardSpreadPicker.tsx` chỉ còn là wrapper (giữ `ContextPanel` + layout
>   desktop riêng). **Đề xuất: có** — tránh fork 2 bản gần giống nhau
>   (design-system.md "search before creating"/"variants over forks"); phương
>   án khác (copy riêng 1 bản cho Đọc nhanh) sẽ nhân đôi 150 dòng logic
>   layout đã tune kỹ, và mọi lần sửa timing sau này phải sửa 2 nơi.
> - **Số lượng slot cho Đọc nhanh**: Đọc sâu dùng 24 (`env.DEEP_SPREAD_SLOTS`).
>   **Đề xuất: 12** — Đọc nhanh miễn phí, không cần cảm giác "kho bài" hoành
>   tráng như Đọc sâu (trả phí), 12 vẫn đủ cảm giác "tự chọn" mà nhẹ hơn ở
>   375px (ít hàng hơn, đỡ cuộn).
> - **Có giữ bước "idle" trước khi spread hiện ra không?** (nút bấm + 1 nhịp
>   xáo ngắn thuần client, không chờ mạng vì Đọc nhanh không cần mint token
>   trước). **Đề xuất: có** — giữ cảm giác nghi thức nhất quán với Đọc sâu
>   (question → shuffling → picking), và tránh animation tự chạy ngay khi vừa
>   vào trang.
>
> Nếu bạn không phản hồi trước `/execute`, tôi sẽ triển khai theo cả 3 đề xuất.

## Approach
`CardSpread` là component "ngu" thuần visual: nhận `slots`, `pickCount`,
`ariaLabel`, và 3 callback (`onPick`, `onActiveCardChange`, `onAllPicked`) —
không biết gì về token ký, credits, hay Lớp Cá nhân. Nó sở hữu toàn bộ layout
tính toán deck/slot, animation deal/fly/flip, và mọi hằng số timing
(`DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`, easing) y nguyên giá trị hiện tại —
chuyển *chỗ định nghĩa*, không đổi *giá trị*. `CardSpreadPicker.tsx` (Đọc sâu)
giữ nguyên phần "vỏ" riêng của nó (breakout layout desktop 70/30,
`ContextPanel`, gọi `/api/reading/deep/reveal`) và chỉ gọi `CardSpread` ở
giữa. `ReadingStage.tsx` (Đọc nhanh) bỏ hẳn `GhostDeck`/`FlipCard`, dùng
`CardSpread` với `pickCount=1`, `onPick` gọi `/api/reading` hiện có, không có
`ContextPanel` — sau khi `onAllPicked` bắn (đúng 1 lá), fade sang
`ResultPanel` y như luồng success cũ.

**Considered and rejected**
- Copy nguyên `CardSpreadPicker.tsx` thành 1 bản riêng cho Đọc nhanh, sửa
  `count=1` tại chỗ — nhanh hơn ngắn hạn nhưng nhân đôi ~150 dòng logic
  layout/animation đã tune kỹ; mọi lần chỉnh easing/timing sau này (rất có
  khả năng xảy ra, xem lịch sử 7 revision của Đọc sâu) phải sửa 2 nơi, dễ
  lệch nhau âm thầm.
- Dùng `CardSpreadPicker` trực tiếp cho Đọc nhanh, chỉ truyền `slots` nhỏ hơn
  — không được vì `allRevealed = flying.length >= 3` đang hardcode 3, và toàn
  bộ `ContextPanel`/token/reveal-by-index gắn chặt với luồng trả phí; sửa nó
  để "tắt" hết phần đó đi phức tạp hơn tách riêng.
- Giữ nguyên `ReadingStage` như cũ, chỉ thêm animation mượt hơn cho
  GhostDeck/FlipCard hiện có — bị loại vì user đã xác nhận rõ muốn đổi hẳn
  cơ chế tương tác (trải-rộng-chọn-lá), không chỉ tinh chỉnh cái cũ.

## Proposed Changes

### Primitives
#### [NEW] `src/components/reading/CardSpread.tsx`
- Chuyển nguyên từ `CardSpreadPicker.tsx`: `RevealedCard` interface,
  `SlotSpec`/`FlyCard` interface, `DEAL_MS/DEAL_EASE/DEAL_STAGGER_MS/FLY_MS/
  FLIP_MS/PRESS_MS` (giá trị y nguyên), `spacePx`, `cardSizeForWidth`,
  `computeDeckSlots`, `stackOrigin`, toàn bộ JSX deck+flying-card+`StarField`
  hiện có trong return của `CardSpreadPicker` (phần `role="group"` trở
  xuống, KHÔNG gồm `ContextPanel`)
- **Không chuyển**: `computeTableSlots` (dùng `layout.tableSlots` cho vị trí
  "bàn" cố định 3 ô — Đọc nhanh chỉ có 1 lá, không cần bố cục "bàn 3 ô cố
  định", lá đã chọn bay thẳng tới 1 vị trí trung tâm duy nhất — xem props
  `tableSlotsOverride` bên dưới) và không chuyển breakout-desktop
  measure (`wrapRef`/`useLayoutEffect` đo `vw`) — đó là chi tiết layout của
  riêng Đọc sâu (cần chừa chỗ cho `ContextPanel` cố định bên phải)
- Props:
  ```ts
  {
    slots: number;
    pickCount: number;
    ariaLabel: string;
    containerWidth: number;          // đo bởi component cha, xem dưới
    tableSlots: SlotSpec[];          // vị trí "bàn" cho lá đã bốc — cha tính
                                      // (Đọc sâu: computeTableSlots 3 ô cố
                                      // định; Đọc nhanh: 1 ô giữa khung)
    onPick: (slotIndex: number) => Promise<RevealedCard>;
    onActiveCardChange?: (card: RevealedCard | undefined) => void;
    onAllPicked?: (cards: RevealedCard[]) => void;
  }
  ```
  `containerWidth`/`tableSlots` do component cha đo/tính (mỗi luồng có nhu
  cầu layout khác nhau — xem 2 mục dưới) — `CardSpread` chỉ tiêu thụ, không
  tự đo `window`.
- Xuất lại `RevealedCard` type từ đây; `CardSpreadPicker.tsx` import lại
  (không định nghĩa trùng)

### Composed Components
#### [MODIFY] `src/components/reading/CardSpreadPicker.tsx`
- Xoá mọi phần đã chuyển sang `CardSpread.tsx`
- Giữ nguyên 100%: `wrapRef`/`useLayoutEffect` đo breakout desktop, state
  `measure`, `handlePick` (đổi tên nội bộ nếu cần) gọi
  `/api/reading/deep/reveal`, `ContextPanel`, `RevealText`
- Render `<CardSpread slots={slots} pickCount={3} ariaLabel="Chọn 3 lá bài
  bất kỳ" containerWidth={containerWidth} tableSlots={computeTableSlots(...)}
  onPick={handlePick} onActiveCardChange={setActiveSlotCard}
  onAllPicked={() => setAllRevealed(true)} />` rồi `<ContextPanel .../>` —
  đúng cấu trúc cũ, chỉ đổi chỗ JSX deck nằm ở component khác
- **Bất biến bắt buộc**: `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`, easing, thứ tự
  2 nhịp `setTimeout` (40ms trigger + FLY_MS + 30ms đệm trước khi lật) không
  đổi 1 giá trị nào

#### [MODIFY] `src/components/reading/ReadingStage.tsx`
- Xoá `GhostDeck`, `FlipCard` (không còn dùng)
- Thêm state đo `containerWidth` đơn giản (1 `useLayoutEffect` đo
  `wrapRef.current?.clientWidth`, KHÔNG cần breakout desktop vì không có
  `ContextPanel` bên cạnh)
- `tableSlots`: 1 ô duy nhất, căn giữa `containerWidth` (constant tính 1 lần,
  không cần hàm riêng — 3-4 dòng)
- Giữ `stage` machine nhưng đơn giản hoá: `idle → shuffling → picking →
  success | error` — bỏ `revealing` (không còn "lật" tách rời khỏi "bấm
  chọn", `CardSpread` tự lo cả 2). `shuffling`: nhịp ngắn thuần client
  (`motionMs("--motion-shuffle", 1100)`, KHÔNG gọi `/api/reading` ở bước này
  — API chỉ gọi trong `onPick` khi user thực sự bấm 1 slot)
- `onPick={async (slotIndex) => { const res = await fetch("/api/reading", ...
  {topic}); const data = (await res.json()) as ReadingResult; fullResultRef
  .current = data; return { cardId: data.card.id, nameVi: data.card.nameVi,
  image: data.card.image, orientation: data.card.orientation, base: data.base
  }; }}` — giữ nguyên request/response `/api/reading` không đổi
- `onAllPicked={() => setStage("success")}` — đọc `fullResultRef.current`
  (đã có đủ `nameEn`/`topic` mà `RevealedCard` không giữ) để truyền vào
  `ResultPanel`
- Lỗi fetch trong `onPick` throw lại để `CardSpread` tự hiện `role="alert"`
  sẵn có (đã có trong `CardSpread`, không cần `error` state riêng ở
  `ReadingStage` nữa — nhưng vẫn giữ nút "Thử lại" nếu `CardSpread` không đủ
  chỗ hiện — xem Verification Plan mục thủ công)

### Pages / Routes
- Không đổi route nào (`/trai-bai`, `/doc-sau` giữ nguyên)

## Accessibility Plan
- `role="group"` + `aria-label` của `CardSpread` nhận qua prop, đổi text
  theo ngữ cảnh ("Chọn 1 lá bài bất kỳ" cho Đọc nhanh, "Chọn 3 lá bài bất kỳ"
  cho Đọc sâu — không đổi hành vi Đọc sâu)
- Touch target 44×44px của từng slot giữ nguyên (đã tính trong
  `computeDeckSlots`, không đổi công thức)
- `aria-label`/`aria-pressed` trên từng nút slot và lá đã bốc giữ nguyên y
  hệt logic hiện có trong `CardSpreadPicker`
- `prefers-reduced-motion`: `CardSpread` giữ nguyên nhánh `reducedMotion` đã
  có (cross-fade thay vì `rotateY`, bỏ `transition` trên `left`/`top`) —
  không viết lại, chỉ chuyển chỗ
- Focus: sau khi 1 lá được chọn ở Đọc nhanh và `ResultPanel` xuất hiện, giữ
  hành vi focus hiện tại của `ResultPanel` (`tabIndex={-1}` + focus tự động
  đã có sẵn, không đổi)

## Blast Radius
| Changed | Consumers | Risk |
|---|---|---|
| `CardSpreadPicker.tsx` (refactor, không đổi props public) | `DeepReadingStage.tsx` (import component, không đổi cách gọi) | Rủi ro chính của cả plan — phải verify `/doc-sau` pixel-for-pixel giống hệt trước refactor, cả animation lẫn layout desktop/mobile |
| `RevealedCard` type di chuyển sang `CardSpread.tsx` | Không consumer nào khác ngoài `CardSpreadPicker.tsx` (đã grep xác nhận — `RevealedCardForPrompt` ở `deep-reading-prompt.ts` là type khác, không liên quan) | Thấp |
| `ReadingStage.tsx` (viết lại state machine) | Chỉ `src/app/trai-bai/page.tsx` (1 consumer, prop `topic` không đổi) | Trung bình — đây là luồng free tier, traffic cao nhất trang, cần verify kỹ 4 trạng thái |
| `GhostDeck`/`FlipCard` xoá khỏi `ReadingStage.tsx` | Không export ra ngoài file, chỉ dùng nội bộ | Thấp — xoá an toàn |

## Verification Plan
### Automated
```
pnpm lint
npx tsc --noEmit
pnpm build
```

### Manual
1. **Hồi quy `/doc-sau` trước tiên** (ưu tiên cao nhất) — trải bài 3 lá y hệt
   luồng cũ: dùng `/api/dev-mint-token` (route dev bypass hiện có) để vào
   `picking` mà không cần AI key thật, xác nhận deal/fly/flip/timing/layout
   desktop 70/30 không đổi 1 pixel so với trước refactor (so ảnh chụp
   trước/sau)
2. `/trai-bai?topic=love` (và 1 topic khác) — đủ 4 trạng thái: idle (nút bắt
   đầu) → shuffling (nhịp ngắn) → picking (trải 12 lá, bấm chọn 1) → success
   (`ResultPanel`) → error (ngắt mạng giữa lúc `onPick` để xem `role="alert"`)
3. 375/768/1280px, cả 2 theme, cho cả `/trai-bai` và `/doc-sau`
4. `prefers-reduced-motion` thật (Playwright `reducedMotion:"reduce"`) cho cả
   2 luồng — không chỉ theo dõi token duration mà xác nhận nhánh cross-fade
   chạy đúng
5. Tab qua toàn bộ khu chọn lá ở cả 2 luồng — focus ring + `aria-label` đúng

## Out of Scope
- Đổi `DEAL_MS/FLY_MS/FLIP_MS/PRESS_MS`, easing, hoặc bất kỳ hằng số nào của
  Đọc sâu
- Đổi API `/api/reading`, thêm credits/token cho Đọc nhanh
- Đổi `ContextPanel`, `RevealText`, `DeepResultStream`, `ResultPanel`
- Đổi ảnh mặt sau lá bài tạm thời
- Đổi số slot của Đọc sâu (giữ `env.DEEP_SPREAD_SLOTS`, mặc định 24)
