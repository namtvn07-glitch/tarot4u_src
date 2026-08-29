# Ghi spec 2 pattern từ boitarot.com.vn vào thiết kế Đọc sâu (4c)

Lượt trước tôi đề xuất ghi 2 pattern quan sát được ở boitarot.com.vn (ép
hướng theo câu hỏi, deck trải rộng cho tự chọn) như mục "không nên copy".
Bạn muốn ngược lại: **dùng cả hai**, áp cho luồng 3 lá trả phí (Đọc sâu,
Giai đoạn 4c — chưa build). Vì 4c chưa tới lượt code, việc cần làm bây giờ
là ghi 2 pattern này thành **spec chính thức** trong `Research/plan/`, có
điều chỉnh kỹ thuật để không phá nguyên tắc RNG server-side đã chốt.

## Decisions Needed From You
> [!IMPORTANT]
> - **Lưu tạm 3 lá đã rút chờ "mở" từng vị trí bằng gì?** Khuyến nghị:
>   **token ký ngắn hạn** (HMAC/JWT, server ký lúc rút, client giữ token mù
>   chữ, gửi lại khi reveal từng vị trí) — không cần bảng Postgres mới, không
>   cần cron dọn dẹp. Lựa chọn còn lại: bảng `pending_draws` + TTL, giống
>   pattern `orders` đã có ở `05-thanh-toan-credits.md` nhưng thêm 1 bảng cho
>   một luồng phụ. Chốt thật khi build 4c — spec lần này ghi cả 2, đề xuất
>   token ký làm mặc định.
> - **Có cần nhân bản lá để "trải rộng" như đối thủ không?** Khuyến nghị:
>   **không cần** — thiết kế an toàn của Ventus không gắn danh tính lá thật
>   vào client trước khi mở, nên bao nhiêu vị trí hiển thị cũng chỉ là lá úp
>   giống hệt nhau, không cần nhân bản từ 78 lá thật để "nhìn dày" như đối
>   thủ phải làm (họ nhân bản vì đã lộ identity thật trong DOM ngay từ đầu).
>   Nếu bạn vẫn muốn cảm giác "dày" hơn 78, có thể tăng số vị trí hiển thị
>   (ví dụ 90–120 ô úp) mà không cần logic nhân bản card thật nào — ghi rõ 2
>   lựa chọn này trong spec, bạn chọn số vị trí khi build.

## Approach
Thêm nội dung vào đúng 2 file đã "sở hữu" 2 khía cạnh này theo cấu trúc tài
liệu hiện có: `01-san-pham-pham-vi.md` (chủ sở hữu UX/luồng người dùng) nhận
phần mô tả giao diện tự chọn + vị trí trong luồng Đọc sâu; `03-kien-truc-ai.md`
§7 (đã có sẵn phần RNG rút bài) nhận 2 subsection kỹ thuật mới — §7.1 (ép
hướng) và §7.2 (cơ chế tự chọn an toàn), viết theo đúng văn phong/format code
sketch đã dùng ở phần gốc của §7. Không tạo file mới — tránh phân mảnh tài
liệu khi 2 file chủ đề đã tồn tại đúng chỗ.

**Considered and rejected**
- Tạo file `Research/plan/10-doc-sau-3-la-spec.md` riêng — rejected: nội
  dung chia đúng 2 mối quan tâm đã có chủ (product/UX vs kiến trúc AI+RNG),
  tách file riêng sẽ trùng lặp ngữ cảnh và có nguy cơ lệch khi 1 trong 2 file
  gốc đổi sau này.
- Copy nguyên cơ chế nhân bản 40–60 lá của đối thủ — rejected (xem Decision
  #2): không cần thiết cho thiết kế an toàn của Ventus, thêm mà không có lợi
  ích thật.
- Copy nguyên danh sách ~40 câu hỏi cứng để match "ép hướng" — rejected:
  input của Ventus là tự do hoàn toàn, exact-match sẽ bỏ sót gần hết biến
  thể thật; dùng phân loại ngữ nghĩa qua bước Haiku đã có sẵn tổng quát hơn
  và không tốn thêm lượt gọi AI.

## Proposed Changes

### Content
#### [MODIFY] `Research/plan/01-san-pham-pham-vi.md`

**§3 "Phạm vi v1 (MVP)" → mục "Trải bài" — thêm 1 bullet sau bullet hiện
có:**

Cũ:
> - Trải 1 lá (free và paid) — trải 3 lá (paid)

Mới:
> - Trải 1 lá (free và paid) — trải 3 lá (paid)
> - Trải 3 lá (Đọc sâu) dùng **giao diện "tự tay chọn"**: hiện một dải lá úp
>   (nhiều vị trí hơn 3, xem `03-kien-truc-ai.md §7.2`) để user tự bấm chọn
>   theo cảm giác, thay vì chỉ có 1 nút "xáo bài" duy nhất như luồng free 1
>   lá. Lấy cảm hứng từ boitarot.com.vn nhưng điều chỉnh cơ chế RNG để không
>   lộ danh tính lá qua client trước khi chọn — chi tiết ở `03-kien-truc-ai.md §7.2`.

**§5.2 "Trải bài sâu (đã đăng nhập, có credits)" — thay toàn bộ khối code
flow:**

Cũ:
> ```
> Chọn chủ đề → Nhập câu hỏi (tùy chọn, max 300 ký tự)
>   → Kiểm duyệt câu hỏi (Haiku 4.5, ~200ms)
>   → Rút bài (RNG server-side)
>   → Trừ credits (atomic)
>   → Hiển thị lớp Nền ngay lập tức
>   → Stream lớp Cá nhân
>   → Lưu vào readings
> ```

Mới:
> ```
> Chọn chủ đề → Nhập câu hỏi (tùy chọn, max 300 ký tự)
>   → Kiểm duyệt câu hỏi (Haiku 4.5, ~200ms) — cùng lượt gọi này phân loại
>     luôn câu hỏi có thuộc nhóm "ép hướng" không (xem 03-kien-truc-ai.md
>     §7.1), không thêm lượt gọi AI riêng
>   → Server rút 3 lá + hướng (RNG server-side, áp quy tắc ép hướng nếu
>     phân loại ở trên yêu cầu) — kết quả giữ kín, gói vào token ký, CHƯA
>     gửi nội dung thật về client
>   → Hiện dải lá úp (nhiều vị trí hơn 3) cho user tự bấm chọn 3 vị trí bất
>     kỳ theo cảm giác
>   → Mỗi lần bấm 1 vị trí, server trả đúng 1 trong 3 lá đã rút sẵn theo
>     THỨ TỰ user đã chọn — vị trí bấm không quyết định lá nào lộ ra (xem
>     03-kien-truc-ai.md §7.2)
>   → Trừ credits (atomic, sau khi đã chọn đủ 3 vị trí)
>   → Hiển thị lớp Nền ngay lập tức
>   → Stream lớp Cá nhân
>   → Lưu vào readings
> ```

---

#### [MODIFY] `Research/plan/03-kien-truc-ai.md`

**Thêm 2 subsection mới vào cuối `## 7. RNG rút bài`** (sau đoạn
`crypto.randomInt` hiện có, trước dòng "**Tiếp theo:**" cuối file):

```markdown
### 7.1 Ép hướng theo phân loại câu hỏi (chỉ Đọc sâu, 3 lá)

Quan sát từ boitarot.com.vn: với câu hỏi tình cảm nhạy cảm (vd "người yêu
cũ còn giữ tình cảm không"), họ ép cả bộ bài rút được cùng 1 chiều xuôi/ngược
thay vì random độc lập từng lá — tạo cảm giác diễn giải "nhất quán, có chủ
đích" hơn thay vì 3 lá ngẫu nhiên rời rạc về hướng.

**Khác với đối thủ, Ventus không so khớp câu hỏi bằng danh sách cố định**
(không khả thi — input tự do tiếng Việt có vô số cách diễn đạt cùng một ý).
Thay vào đó, mở rộng structured output của bước kiểm duyệt Haiku 4.5 đã có ở
§5.3 — model tự phân loại câu hỏi có thuộc nhóm cần "ép hướng" không, dựa
trên ngữ nghĩa thật thay vì so khớp chuỗi:

```ts
const Triage = z.object({
  category: z.enum(['ok', 'crisis', 'medical', 'legal', 'harmful', 'nonsense']),
  reason: z.string(),
  orientation_mode: z.enum(['independent', 'unified']),  // MỚI
})
```

`orientation_mode: 'unified'` cho câu hỏi dạng quan hệ/tình cảm cần cảm giác
nhất quán (vd "người ấy nghĩ gì về tôi"); `'independent'` cho mọi câu hỏi
khác — mặc định giữ hành vi hiện tại (random độc lập từng lá).

```ts
function drawCards(
  count: number,
  orientationMode: 'independent' | 'unified' = 'independent'
): Draw {
  const deck = [...CARD_IDS]
  const drawn = []
  const unifiedOrientation: Orientation =
    randomInt(2) === 0 ? 'upright' : 'reversed'   // chỉ dùng nếu unified

  for (let i = 0; i < count; i++) {
    const idx = randomInt(deck.length)
    const [cardId] = deck.splice(idx, 1)
    const orientation =
      orientationMode === 'unified'
        ? unifiedOrientation
        : (randomInt(2) === 0 ? 'upright' : 'reversed')
    drawn.push({ cardId, orientation, position: i })
  }
  return { cards: drawn }
}
```

> `orientationMode` luôn đến từ kết quả kiểm duyệt Haiku 4.5 chạy server-side
> ở bước trước, **không bao giờ** nhận trực tiếp từ client — cùng nguyên tắc
> "RNG server-side, không tin input phía client" đã nêu ở đầu §7.

### 7.2 Giao diện "tự chọn lá" an toàn (chỉ Đọc sâu, 3 lá)

Quan sát từ boitarot.com.vn: họ trải 40–60 lá (nhân bản từ 78 lá thật) để
user tự bấm chọn, cảm giác thật hơn so với chỉ bấm 1 nút "xáo bài". Nhưng
đọc source JS của họ ([tarot-reader5b6c.js §"Data builders"]) cho thấy card
id/tên thật đã được gắn vào từng phần tử DOM **ngay khi dựng bộ bài**, trước
khi user bấm — ai mở DevTools/Network cũng đọc được toàn bộ kết quả sắp
"rút ra", phá vỡ tính ngẫu nhiên và cho phép chọn lá muốn có. Việc nhân bản
40–60 lá từ 78 lá thật chỉ để che bớt cảm giác lặp, không giải quyết vấn đề
gốc.

**Ventus giữ lại cảm giác "tự tay chọn từ một dải bài rộng", bỏ đi phần lộ
danh tính:**

1. Khi user bấm "Xào bài", server rút sẵn 3 lá + hướng bằng `drawCards(3,
   orientationMode)` ở §7.1 — đóng gói kết quả vào 1 token ký (HMAC, TTL vài
   phút), **không** trả nội dung thật về client.
2. Client hiện N vị trí lá úp giống hệt nhau (N tuỳ chọn khi build, ví dụ
   21–120 — không cần khớp con số 78 hay nhân bản card thật nào, vì không vị
   trí nào mang danh tính thật trước khi mở).
3. User bấm chọn 3 trong N vị trí, theo thứ tự bất kỳ.
4. Mỗi lần bấm, client gửi token (giữ nguyên, không đổi) tới
   `POST /api/reading/reveal { token, revealIndex }` — server verify chữ ký,
   trả về đúng lá thứ `revealIndex` (1, 2, hoặc 3) trong 3 lá đã rút ở bước 1.
   **Vị trí user bấm trên UI không có quan hệ gì với lá nào bị lộ** — chỉ có
   thứ tự bấm (lần 1/2/3) mới quyết định.
5. Sau khi đủ 3 lần reveal, flow tiếp tục bình thường: trừ credits, hiển thị
   lớp Nền, stream lớp Cá nhân, lưu `readings`.

> Vì client không bao giờ nhận danh tính lá thật trước khi reveal, không cần
> cơ chế nhân bản 78→40-60 lá của đối thủ để "che" identity — N vị trí hiển
> thị hoàn toàn tuỳ chỉnh theo mong muốn hình ảnh, tách rời khỏi bảo mật RNG.
```

## Accessibility Plan
n/a — thay đổi chỉ là nội dung Markdown trong tài liệu spec nội bộ, chưa
sinh UI thật.

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `01-san-pham-pham-vi.md` §3, §5.2 | `03-kien-truc-ai.md` (đã link 2 chiều, nội dung khớp nhau theo plan này); `brain/phase-4b-trai-bai/task.md` dòng "Trải 3 lá — chỉ dành cho Đọc sâu (paid), thuộc 4c" (không mâu thuẫn, chỉ tham chiếu, không trích chi tiết) | Thấp |
| `03-kien-truc-ai.md` §7 | Không file nào khác trích dẫn nguyên văn nội dung §7 hiện tại (đã grep — chỉ `08-timeline.md` link tới file, không trích đoạn) | Thấp |

## Verification Plan
### Automated
n/a — Markdown thuần trong `Research/`, không có gate lint/typecheck/test/
build áp dụng.

### Manual
1. Đọc lại `01-san-pham-pham-vi.md` §3/§5.2 sau khi sửa — đảm bảo luồng mới
   không mâu thuẫn với §4 (4 trạng thái) hay §6 (định nghĩa "xong").
2. Đọc lại `03-kien-truc-ai.md` §7 hoàn chỉnh (gốc + 7.1 + 7.2) — đảm bảo
   code sketch mới không mâu thuẫn với nguyên tắc "RNG server-side, crypto.randomInt"
   đã nêu ở đầu section.
3. Kiểm tra 2 file trỏ đúng lẫn nhau (link `03-kien-truc-ai.md §7.2` từ
   `01-san-pham-pham-vi.md`, và ngược lại nếu có).

## Out of Scope
- Không tạo endpoint `/api/reading/reveal` thật hay bảng DB nào — chỉ mô tả
  thiết kế dự kiến trong spec.
- Không sửa `Research/doi-thu-canh-tranh.md` (giữ nguyên, có thể cập nhật ở
  lượt khác nếu bạn muốn — bao gồm cả correction "có thu phí online" chưa
  áp dụng từ lượt plan trước).
- Không đổi `brain/phase-4b-trai-bai/` (luồng 1 lá free đã xong, không đụng
  tới).
- Không chốt cứng "token ký" vs "bảng Postgres tạm" — để mở, quyết định thật
  khi build 4c (xem Open Questions ở task.md).
