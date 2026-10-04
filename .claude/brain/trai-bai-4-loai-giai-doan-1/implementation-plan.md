# Trải bài 4 loại — Giai đoạn 1 (v2)

Triển khai theo docs thiết kế `design/PROMT XEMBAITAROT.VN (phần 1, phần 2).md`.
Phạm vi giai đoạn này: **nền tảng (registry + schema + renderer) + Daily 1 lá +
nâng 3 lá lên đầu ra JSON có cấu trúc**. 5 lá và Yes/No hoãn (registry chừa chỗ).

Nguồn: docs thiết kế (2 phần), sheet feedback (3 hạng mục), review code 2026-10-04.
v2 (cùng ngày) gộp các quyết định sau khi đọc prompt thật ở phần 2.

## Quyết định đã chốt
> [!IMPORTANT]
> - **Daily = sinh sẵn, không gọi API lúc chạy** (đầu vào chỉ là lá + chiều; xem lý do ở "Approach").
> - **3 lá = không stream, kèm hiện dần bằng animation (hướng A + C)**: server chờ đủ JSON,
>   validate bằng zod, gửi một lần; giao diện bung từng khối theo nhịp. Giữ phong bì NDJSON ở route
>   để nâng lên stream từng khối khi làm 5 lá.
> - Free Daily 1 lần/ngày/user; lượt sau 1 credit.
> - Route Daily: `/hom-nay`, 301 từ `/trai-bai`. Giờ "ngày" theo `Asia/Ho_Chi_Minh`, tính ở server.
> - Khách ẩn danh: tự tạo phiên ẩn danh, quota theo phiên + lưới IP; rút lần 2 phải có tài khoản/credits
>   (gói `single` chỉ mở Đọc sâu, không mua 1 credit lẻ).
> - Prompt của user (phần 2) dùng NGUYÊN VĂN làm bản đầu để chạy thử pipeline; phase cuối chỉ
>   đánh giá và tinh chỉnh.

## Giả định cần xác nhận (đang dùng mặc định)
> - 3 biến thể/mỗi (lá, chiều) → 468 bản Daily. (2 biến thể = tối thiểu, 4 = dư dả.)
> - Daily có rút ngược (156 tổ hợp), khớp nhánh Reversed trong Prompt 01.
> - Tối đa 5 lượt Daily/ngày (hằng số).
> - Hỏi nối tiếp (feedback #3), 5 lá, Yes/No, chủ đề mới: ngoài phạm vi.

## Approach
Tách "loại trải bài" thành cấu hình (registry) và tách prompt thành module cắm-rút, mỗi spread có
**zod schema** là nguồn sự thật chung cho prompt, validate và giao diện. Daily có đường đi riêng
(nội dung sinh sẵn trong DB + claim atomic) vì có hạn mức free theo ngày. 3 lá giữ luồng
shuffle → reveal → personal nhưng đầu ra chuyển từ chữ stream sang object JSON.

**Daily — vì sao sinh sẵn và chọn lá kiểu "bộ bài riêng":**
- Prompt 01 nhận `current_date`, lá, số, arcana, suit, chiều, keywords; không có đầu vào người dùng →
  gọi AI mỗi lần chỉ lấy mẫu lại từ 156 tổ hợp. Realtime tốn ~$0.015–0.02/lượt (ước tính từ
  07-du-toan-chi-phi.md), tăng theo DAU, thêm độ trễ và đường lỗi cho lượt free.
- Điểm số theo lĩnh vực phải nhất quán theo lá → lấy **trung vị của các biến thể** làm điểm chung.
- Chọn lá: rút **không hoàn lại** từ bộ 78 lá riêng của từng người (đọc lịch sử `readings`, không
  cần bảng mới); hết 78 thì xáo lại; chiều random mỗi lần → cùng lá không quay lại trước 78 ngày;
  chu kỳ sau xoay sang biến thể chưa xem → ~234 ngày không lặp nội dung với 3 biến thể.
- Pool sinh bằng quy trình agent giống Lớp Nền (không cần API key; xem scripts/base-content).

**3 lá — vì sao không stream:** đầu ra là một khối JSON chỉ dùng được khi đủ và hợp lệ. Chờ đủ
→ validate → lưu atomic → gửi một lần. Lỗi thì hoàn credit và người dùng chưa thấy gì dở dang.
Bù độ trễ (ước tính 10–30s, **cần đo**) bằng màn hình chờ theo chặng + bung khối dần.

**Considered and rejected**
- Realtime cho Daily — không thêm giá trị, tốn tiền theo DAU.
- Sinh Daily lười (lần đầu có người rút mới sinh) — người đầu chờ/lỗi, không duyệt trước được.
- Stream JSON từng khối cho 3 lá (hướng B) — parser dở dang, JSON có thể kèm ```json, lỗi cuối
  khi người dùng đã thấy nửa bài. Để dành khi làm 5 lá nếu đo thấy chờ quá lâu.
- Hash(user+ngày) để chọn lá — rút lần 2 phải ra lá khác, phải lưu kết quả dù sao.
- Viết lại `DeepReadScreen` (1701 dòng) — chỉ trích phần cần chạm; nhưng phần stream/NDJSON/
  `streamedText` sẽ được thay (xem Phase 6).

## Proposed Changes

### Phase 0 — Chuẩn bị (0.5 ngày)
- Script đo độ trễ prompt 3 lá thật (tham khảo `scripts/testLiveAI.js`), chạy ~10 lần trên
  provider đang dùng; **user chạy** vì hook chặn đọc `.env.local`. Ngưỡng quyết định: trung vị
  ≤ 15s → giữ A+C; ≥ 25–30s → cân nhắc stream từng khối (B) ngay.
- Chốt "giả định cần xác nhận" ở trên.

### Phase 1 — Nền tảng (1.5 ngày)
#### [NEW] `src/lib/spreads.ts` — registry
- id, số lá, positions (key, labelVi, role), giá, hạn mức free, tier DB, `enabled`.
  Bật `daily`, `three_card`; chưa khai báo `five_card`, `yes_no`.
- Key vị trí khớp prompt: 3 lá `past/present/future` (Prompt 02); 5 lá sẽ là
  `root/current/hidden_factor/future/outcome_guidance`.
#### [NEW] `src/lib/ai/schemas/` — zod schema theo spread
- `daily` (Prompt 01), `three_card` (Prompt 02): đúng các trường trong "OUTPUT JSON" của design.
- `disclaimer` KHÔNG do model sinh: hằng số ở UI (tiết kiệm token, không lệch chữ).
#### [NEW] `src/lib/ai/prompts/` — PromptBuilder + Safety preamble
- `buildPrompt(ctx) → { system, userTurn, maxTokens }`; prompt phần 2 đặt thành module.
- **Safety preamble chung** (giữ từ `PERSONAL_LAYER_SYSTEM`): không chẩn đoán/tiên lượng bệnh,
  không tư vấn pháp lý, không khuyến nghị đầu tư, không suy luận tuổi/ngày sinh từ câu hỏi. Các
  prompt phần 2 chỉ nhắc một phần các ràng buộc này nên phải ghép preamble vào.
#### [NEW] `ReadingContext` builder (server)
- Tính ở server, không để model đếm: `major_count`, `minor_count`, `dominant_suit`, số lá ngược,
  pattern số; truyền vào prompt và **ghi đè** giá trị model trả về nếu lệch.
- Đủ trường đầu vào của prompt: tên lá, số, arcana, suit, chiều, keywords, vị trí, chủ đề, câu hỏi.
#### [NEW] Result renderer theo schema
- Dựng khối từ object đã validate (không còn `dangerouslySetInnerHTML` ở
  `DeepReadScreen.tsx:944-964` → đóng lỗ XSS qua prompt injection). Dùng chung cho kết quả
  mới, Lịch sử và ReadingDetailModal; có nhánh hiển thị `personal_body` cũ cho bản ghi trước đây.
#### [MODIFY] nhãn vị trí
- Lấy từ registry thay vì hard-code ở `DeepReadScreen` (~872, 981, 1300, 1488, 1612) và `app/page.tsx`.

### Phase 2 — Database (1 ngày)
#### [NEW] migration
- `readings`: `tier` thêm `'daily'` (giữ `'quick'`); cột `daily_date date`, `result jsonb`;
  index `(user_id, daily_date)`.
- Bảng `daily_content(card_id, orientation, variant, version, status, content jsonb, scores)`,
  unique `(card_id, orientation, variant, version)`; RLS: không cho client đọc trực tiếp,
  server đọc bằng service role.
- Bảng `daily_claims(user_id, day, reading_id)`, PK `(user_id, day)`; chỉ ghi lượt free.
- `claim_daily_draw(p_user_id, p_reading_id, p_day, p_cost)`: insert claim → `free`; đã có →
  `debit_reading` → `paid`; `reading_id` trùng claim cũ → trả kết quả cũ (idempotent); thiếu
  credits → `insufficient_credits`.
- `release_daily_claim(reading_id)`: nhả lượt free khi sinh/ghi lỗi.
- Sửa 2 bản `admin_overview_stats`: đếm `tier in ('quick','daily')`.
- **Bắt buộc** (bài học 2026-08-19, 2026-09-20): `revoke ... from public` + `grant execute ...
  to service_role` tường minh; verify bằng `information_schema.routine_privileges`; không
  `drop function` hàm tiền nếu tránh được. `apply_migration` bị chặn → chạy tay qua Dashboard.

### Phase 3 — Sinh nội dung Daily (1.5–2 ngày)
#### [NEW] `scripts/daily-content/` (tái dùng khung `scripts/base-content`)
- Prompt 01 nguyên văn nhưng: bỏ `current_date`, bỏ phần disclaimer (hằng số), thêm Safety preamble.
- Sinh 156 × 3 = 468 bản bằng quy trình agent (không API key); gộp + validate cục bộ.
- **Lint tự động cho toàn bộ**: parse zod; 250–350 từ; đoạn ≤ 3 câu; điểm nguyên 1–10; không có
  từ cấm ("chắc chắn", "định mệnh", "số phận", "tiên tri"); `forecast` 2–3 mục; có `memorable_message`.
- **Chuẩn hoá điểm**: trung vị 3 biến thể → điểm chung cho (lá, chiều).
- Duyệt người: đọc kỹ Major (22 × 2 × 3 = 132 bản), đọc mẫu Minor. Tổng ~468 × ~320 từ ≈
  150.000 từ nên không đọc hết bằng tay.
- Import vào `daily_content` với `status='approved'` (mở rộng `seedBaseContent.js`/`import.ts`).

### Phase 4 — API Daily (1–1.5 ngày)
#### [NEW] `src/app/api/reading/daily/route.ts`
- `GET`: lá hôm nay (nếu đã rút), còn free không, giá, số lượt hôm nay, số dư.
- `POST {drawId}` (uuid client, khoá idempotency): auth → rate limit (key `reading-daily:...`,
  ẩn danh theo IP) → ngày VN ở server → `claim_daily_draw` → chọn lá theo "bộ bài riêng"
  (loại các lá đã rút trong chu kỳ; chiều random) → chọn biến thể chưa xem → ghi `readings`
  (`result` = nội dung) → lỗi thì `release_daily_claim` (free) / `refund_reading` (paid).
#### [DELETE] `src/app/api/reading/route.ts` (code chết)

### Phase 5 — UI Daily + gỡ tính năng cũ (2 ngày)
#### [NEW] màn hình `/hom-nay`
- Giữ nghi thức xoè/lật bài; click gọi POST rồi mới lật. Lá là `button` thật (QuickRead cũ dùng
  `div onClick`, không focus được).
- Trạng thái: chưa rút / đã rút hôm nay (hiện lại, không tính phí) / hết free ("Rút thêm — 1 credit")
  / khách hết free (CTA đăng ký) / loading / lỗi.
- Kết quả theo JSON: `summary`, điểm 5 chỉ số, `headline`, `forecast`, love/career/finance, `insight`,
  `memorable_message` (đưa lên thẻ chia sẻ), `advice`, disclaimer hằng số; CTA → trải 3 lá.
#### [DELETE] `QuickReadScreen.tsx`, `DailyTarotMessage.tsx`, `app/trai-bai/page.tsx`
#### [MODIFY]
- `types/tarot.ts` (`AppScreen` `quick-read` → `daily`; `ReadingHistoryItem.type` +`daily`;
  `ReadingRow` +`result`), `Header.tsx` (~88, 245), `HomeScreen.tsx` (nút "Rút Nhanh 1 Lá",
  khối "Lớp Nền", section DailyTarotMessage), `Footer.tsx`, `sitemap.ts`, `next.config.ts` (301),
  `app/page.tsx` (select thêm `result`), `ReadingDetailModal`, `AccountScreen`.
- Rà lời văn "Rút nhanh / Lớp Nền / Đọc nhanh": `dieu-khoan`, `doc-sau`, `luu-tai-khoan`,
  `tai-khoan`, `dat-lai-mat-khau`, `AuthModal`, `ReadingDisclaimer`, thư viện bài.
#### Dọn code chết (bước riêng, grep từng file trước khi xoá)
- `ReadingStage`, `ResultPanel`, `DeepReadingStage`, `DeepResultStream`, `CardSpreadPicker`...;
  chú ý comment trong `motion.ts` trỏ `ReadingStage`.

### Phase 6 — Trải 3 lá: đầu ra JSON, không stream (2–2.5 ngày)
#### [MODIFY] `src/app/api/reading/deep/personal/route.ts`
- Giữ nguyên: xác thực token, chặn double-submit, `debit_reading`, refund khi lỗi.
- Đổi: gọi AI một lần (không stream) lấy JSON → zod validate → ghi đè `major_count`/`minor_count`/
  `dominant_suit` bằng giá trị server tính → ghi `readings.result` (+ `personal_body` dạng chữ
  rút gọn làm fallback cho Lịch sử/chia sẻ cũ) → trả về.
- Phong bì NDJSON giữ nguyên: `{"type":"progress","stage":...}` định kỳ (~5s, làm nhịp tim
  chống proxy cắt), cuối cùng `{"type":"result",...}` hoặc `{"type":"error",...}`.
- **Server phải lưu kết quả kể cả khi client ngắt kết nối** (người dùng thoát tab → xem lại ở Lịch
  sử, không mất credit vô ích). Cần kiểm chứng hành vi hàm Vercel khi client abort; có thể dùng
  cơ chế chạy tiếp sau response của Next (vd `after()`).
- JSON sai/AI từ chối/`max_tokens` → `refund_reading` + `error`. Kiểm tra `classify()` hiện có
  (dùng cho triage) có đủ `maxTokens`, timeout, structured-output theo từng provider chưa; nếu
  chưa thì thêm method `generateJson` vào `AiProvider`. `maxTokens` theo spread (Gemini dùng
  chung ngân sách "thinking"); `maxDuration` giữ 120.
#### [MODIFY] `src/screens/DeepReadScreen.tsx` (chỉ phần phase "analysis")
- Bỏ `streamedText`/`isTyping` + parser delta; nhận `result` object; `sessionStorage` lưu object.
- **Màn hình chờ** theo chặng (đổi chữ mỗi vài giây: "Đang đọc mối liên hệ giữa 3 lá…" →
  "Tìm điều bạn có thể chưa nhìn thấy…" → "Viết lời nhắn…"), có `aria-live`, có đường
  `prefers-reduced-motion`.
- **Hiện dần**: Kết luận → Bức tranh lớn → 3 lá → Điều chưa nhìn thấy → Xu hướng → Lời nhắn
  (+ memorable_message, disclaimer hằng số); mỗi khối mờ dần vào theo nhịp, bấm bỏ qua để hiện hết.
- Gỡ các nhánh khôi phục "luận giải dở dang" không còn ý nghĩa (chỉ còn: có kết quả / không có).
- `handleShare`/`handleSave` dựng chữ từ `result`.
#### [MODIFY] token & context
- `personal/route.ts` dùng `ReadingContext` đầy đủ (Phase 1); **không** thêm hidden-question vào
  triage (Prompt 02 đã tự đọc câu hỏi).
- Lớp Nền (`base_content`) giữ làm bản xem thử miễn phí sau khi lật từng lá, không đổi.

### Phase 7 — Kiểm thử (1 ngày)
- Daily: free lần 1 / lần 2 trừ 1 credit / bấm đúp lần 2 chỉ trừ 1 / lỗi giữa chừng (free nhả,
  paid hoàn) / qua nửa đêm giờ VN / reload không tính phí / khách hết lượt / hết credit lần 3 → 402
  / không lặp lá trong chu kỳ / điểm nhất quán giữa các biến thể.
- 3 lá: JSON hợp lệ → hiển thị đủ khối; JSON sai → hoàn credit + thông báo sạch; ngắt mạng giữa
  lúc chờ → kết quả có trong Lịch sử; `major_count` server ghi đè model.
- `npm run lint`, `npm run build`; Playwright với tài khoản thật (project.md 2026-08-18);
  375 / 768 / 1280; reduced-motion; bàn phím.

### Phase 8 (sau) — Đánh giá & tinh chỉnh prompt; Phase 9 (chờ quyết định) — hỏi nối tiếp
- P8: thử 15–20 câu hỏi mẫu so với bản "sau cải tiến" trong sheet; đo chi phí thật từ
  `readings.input_tokens/output_tokens`; chỉnh giá credit.
- P9: `thread_id`, `parent_reading_id`, `turn_index` + route follow-up.
- 5 lá, Yes/No: thêm một mục registry + schema + prompt (đã có trong design) khi sẵn sàng.

## Ước lượng
| Phase | Công sức | Phụ thuộc |
|---|---|---|
| 0 Chuẩn bị + đo | 0.5 ngày | cần user chạy script đo |
| 1 Nền tảng | 1.5 ngày | — |
| 2 Database | 1 ngày | song song được với 1 |
| 3 Sinh nội dung Daily | 1.5–2 ngày (+ thời gian duyệt người) | 1 |
| 4 API Daily | 1–1.5 ngày | 2, 3 |
| 5 UI Daily + gỡ cũ | 2 ngày | 4 |
| 6 Trải 3 lá JSON | 2–2.5 ngày | 1 |
| 7 Kiểm thử | 1 ngày | 5, 6 |
| **Tổng** | **~11–13 ngày làm việc** | |

## Accessibility Plan
- Fan chọn bài: `button` thật, `aria-label`, Enter/Space.
- Màn chờ 3 lá và Daily: `aria-live="polite"`; trạng thái lỗi/credit trong vùng live.
- Hiện dần từng khối: tôn trọng `prefers-reduced-motion` (hiện ngay); nút "hiện hết".
- Điểm số không chỉ dựa vào màu; kiểm tra contrast cả hai theme.
- Heading đúng cấp cho từng khối kết quả.

## Blast Radius
| Changed | Consumers | Risk |
|---|---|---|
| `AppScreen` bỏ `quick-read` | Header, page.tsx, trai-bai page | Sót tham chiếu → bắt bằng build |
| `/trai-bai` → `/hom-nay` | sitemap, Google index | Mất SEO nếu thiếu 301 |
| `readings.tier` thêm `daily` | admin stats RPC, lịch sử | Biểu đồ admin về 0 nếu quên sửa RPC |
| `debit_reading` dùng lại | luồng Đọc sâu | Không đổi chữ ký |
| Đầu ra 3 lá: text stream → JSON | `personal/route.ts`, `DeepReadScreen`, Lịch sử, ReadingDetailModal, share/copy | Bản ghi cũ chỉ có `personal_body` — renderer phải hỗ trợ cả hai |
| Bỏ `dangerouslySetInnerHTML` | hiển thị luận giải | Định dạng thay đổi — kiểm tra bằng bài mẫu |
| Chờ không stream | trải nghiệm sau khi đã trả credit | Đo độ trễ ở Phase 0; thiết kế màn chờ; lưu kết quả khi client ngắt |
| Xoá component chết | — | grep từng file; làm riêng để dễ hoàn tác |

## Verification Plan
### Automated
- `npm run lint`, `npm run build` (dự án chưa có test runner). Validate zod cho toàn bộ 468 bản
  Daily trong script (Phase 3).
### Manual (Playwright, tài khoản thật)
1. Các kịch bản ở Phase 7.
2. 375 / 768 / 1280px, cả hai theme, reduced-motion.
3. Bàn phím: Tab tới từng lá, Enter chọn, focus về kết quả.
4. Sau migration: `routine_privileges` của `claim_daily_draw`, `release_daily_claim`.

## Rủi ro chính
| Rủi ro | Cách giảm |
|---|---|
| Chờ 3 lá quá lâu sau khi đã trừ credit | Đo ở P0; màn chờ theo chặng; heartbeat; ngưỡng chuyển sang stream từng khối |
| Client ngắt giữa lúc chờ → mất kết quả | Server luôn lưu `readings.result`; xem lại ở Lịch sử |
| JSON model sai/kèm ```json | zod + (nếu cần) loại fence trước khi parse; sai → hoàn credit |
| Model đếm Major/Minor sai | Server tính và ghi đè |
| Prompt phần 2 thiếu ràng buộc an toàn so với bản cũ | Safety preamble chung ghép vào mọi prompt |
| 468 bản Daily khó duyệt hết | Lint toàn bộ + đọc kỹ Major + đọc mẫu Minor |
| Đổi prompt Daily → sinh lại toàn bộ | Chi phí gần 0 nhưng phải duyệt lại; có cột `version` |
| Xoá cookie nhận thêm free | Lưới IP; Daily ≈ $0/lượt nên chấp nhận |
| Bấm đúp tạo nhiều lượt trả phí | `drawId` idempotency + `useRef` guard |
| Migration hàm tiền | Grant tường minh; kiểm tra `routine_privileges` |

## Out of Scope
- 5 lá, Yes/No, chủ đề mới (Sức khỏe, Gia đình, Học tập...), hỏi nối tiếp, cá nhân hoá Daily
  theo lĩnh vực quan tâm, Daily realtime tham chiếu lịch sử.

---

## Kết quả triển khai (2026-10-04) — điều chỉnh so với kế hoạch

**Đã làm đúng kế hoạch**: registry, schema, prompt (nguyên văn phần 2 + safety preamble), pipeline Daily,
DB + RPC, API Daily, UI Daily, 3 lá JSON không stream (A+C), lịch sử, dọn code chết.

**Khác với kế hoạch (và vì sao)**
| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| Bảng `daily_claims` (chỉ lượt free) | Bảng `daily_draws` ghi MỌI lượt (free/paid) | Một bảng vừa đếm trần, vừa khoá "1 free/ngày" (unique index một phần), vừa chống bấm đúp |
| RPC `claim_daily_draw(user, reading_id, day, cost)` | `claim_daily_draw(user, draw_id, max_draws, cost)` trả `{kind, reading_id, day}` | Ngày do DB tính (không tin client); `reading_id` do server sinh, `draw_id` của client là khoá idempotency |
| 301 từ `/trai-bai` | 308 (`permanent: true` của Next) | Next dùng 308; giữ nguyên query nên `?ref=` affiliate không mất (đã kiểm) |
| `GET` trả "lá free đầu tiên" | Trả lá **gần nhất** trong ngày | Tải lại trang phải thấy đúng lá người dùng vừa trả tiền; khác D3 một chút |
| Hidden Question trong triage | Bỏ | Prompt 02 tự đọc câu hỏi |
| `personal` route chỉ tạo mới | Thêm `replayOnly` + trả lại kết quả đã có | Cần để khôi phục sau tải lại / đứt mạng mà không trừ tiền 2 lần |
| `readings.id` tự sinh | `readings.id = readingId` (3 lá) | Idempotent, khớp `credit_ledger.ref_id` |
| Cổng kiểm thử bằng Playwright + Supabase thật | Playwright/Edge với **API giả lập** (không có Docker) | Xem "Chưa kiểm chứng" |

**Đã kiểm chứng (có số liệu)**
- tsc exit 0 · lint 0 lỗi (59 cảnh báo, phần lớn có sẵn) · `next build` thành công (có `/hom-nay`, `/api/reading/daily`).
- SQL: 22 ca trên PGlite (free/paid/replay/trần/hết credit/release/hoàn tiền/quyền hàm).
- Chọn lá: 1000 lượt mô phỏng không lặp trong 19 lượt gần nhất; chu kỳ đầu không lá nào ra 2 lần.
- Nội dung Daily: 468/468 hợp lệ, 0 trùng headline/memorable/insight, điểm lá xuôi TB 6.87 vs lá ngược 4.77.
- UI (Edge, 375/768/1280, reduced-motion): Daily 24 kiểm tra, 3 lá 27 kiểm tra (gồm XSS, đứt mạng,
  tải lại giữa chừng, 410 refunded), lịch sử 11 kiểm tra — đều đạt.
- Server-side: ReadingContext/finalize 10 ca (ghi đè major/minor/suit, thiếu lá → sinh lại).

**CHƯA kiểm chứng (nói thẳng)**
- Hai route (`/api/reading/daily`, `/api/reading/deep/personal`) **chưa chạy với database thật** — chỉ
  typecheck + build + test SQL riêng + test UI với API giả.
- `generateJson` với provider thật (Gemini/Anthropic/OpenAI) chưa gọi → chưa biết độ trễ, chưa biết
  schema có bị provider nào từ chối không.
- `after()` giữ hàm chạy tiếp sau khi client ngắt: chưa thử trên Vercel.
- Migration **chưa áp lên production**.

**Thứ tự việc thủ công cho user**
1. Áp `supabase/migrations/20261004000000_daily_reading.sql` (Dashboard SQL hoặc `apply_migration`); sau đó
   kiểm `select grantee, routine_name from information_schema.routine_privileges where routine_name in
   ('claim_daily_draw','release_daily_draw')` — chỉ được có `service_role` (+ owner).
2. `node scripts/seedDailyContent.js` (nạp `draft`) → duyệt → `node scripts/seedDailyContent.js --approve`.
3. `npx tsx --env-file=.env.local scripts/measureThreeCardLatency.mts 8` để đo độ trễ 3 lá.
4. Thử tay một lượt Daily + một lượt 3 lá trên preview trước khi deploy.
