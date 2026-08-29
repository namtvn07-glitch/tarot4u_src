---
description: Rà soát Research/plan và cập nhật trang tổng quan + quản lý tiến độ dự án tại design/index.html
argument-hint: [(trống = cập nhật) | --dry-run | --rebuild | --section <01..09> | --reset]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git log:*), Bash(git status:*), Bash(git ls-files:*), Bash(date:*), Bash(ls:*), Bash(diff:*), Bash(python3 .claude/scripts/build-report.py:*), Bash(python3 .claude/scripts/report-cache.py:*), Bash(.claude/hooks/detect-stack.sh:*), Task
---

# /report — Trang tổng quan & quản lý tiến độ

> Tài liệu này phục vụ **hai** việc: nắm tổng quan dự án, và **theo dõi tiến độ
> tới từng đầu việc**. Nó không phải bản tóm tắt — nó là bảng điều khiển.

Tham số: **$ARGUMENTS**

Nguồn kế hoạch:
!`ls -1 Research/plan/`

Đầu việc đã xong / tổng số:
!`grep -rho "^- \[x\]" Research/ 2>/dev/null | wc -l; grep -rho "^- \[[ x]\]" Research/ 2>/dev/null | wc -l`

Nguồn kế hoạch đổi gì kể từ lần /report trước (xem Step 0):
!`python3 .claude/scripts/report-cache.py 2>/dev/null`

Artifact hiện có:
!`ls -la design/index.html design/report.md 2>/dev/null`

Hoạt động thực tế:
!`git log --oneline -10 2>/dev/null; git status --short`

Ngày build:
!`date +"%Y-%m-%d %H:%M"`

---

## Kiến trúc — ba file, mỗi file một vai

| File | Vai | Ai ghi |
|---|---|---|
| `Research/plan/*.md` | **Nguồn sự thật.** Kế hoạch và checkbox gốc. | Người |
| `design/report.md` | **Tài liệu sống.** Nội dung trang, sửa dần qua từng lần chạy. | `/report` |
| `design/index.html` | Trang hiển thị, dựng từ `template/gdd_template.md`. | `/report` |
| `.claude/state/report-sources.json` | Cache hash nguồn kế hoạch — cho biết file nào đổi kể từ lần chạy trước, xem [Step 0](#step-0--chỉ-đọc-lại-file-đã-đổi-tiết-kiệm-token). | `/report` (`report-cache.py --commit`) |

> [!IMPORTANT]
> **Không bao giờ ghi đè toàn bộ `design/report.md` hay `design/index.html` khi
> chúng đã tồn tại.** Xem [Step 5](#step-5--cập-nhật-chứ-không-viết-mới).

## Step 0 — Chỉ đọc lại file đã đổi (tiết kiệm token)

Đọc hết 9–10 file kế hoạch mỗi lần chạy là chi phí token lớn nhất của lệnh
này, kể cả khi chỉ một file đổi từ lần trước. Khối "Nguồn kế hoạch đổi gì kể
từ lần /report trước" ở trên (từ `report-cache.py`) đã cho biết:

| Kết quả | Nghĩa là |
|---|---|
| `CHƯA CÓ MANIFEST` | Lần đầu chạy (hoặc vừa `--reset`) — coi như không có cache, áp dụng Step 1 gốc: đọc hết |
| `changed (N)` | N file này **phải** đọc lại toàn bộ ở Step 1 |
| `unchanged (N)` | N file này **bỏ qua**, không đọc lại — report.md hiện tại vẫn đúng cho phần dựa trên các file này |
| `đã biến mất khỏi nguồn kế hoạch` | File từng có giờ không còn — đọc nội dung report.md liên quan tới nó và xử lý như Step 3 (nêu ra, không tự xóa) |

Ba trường hợp bắt buộc **bỏ qua cache, coi mọi file là "changed"** (áp dụng
Step 1 gốc — đọc hết):
- Tham số có `--rebuild`
- Kết quả là `CHƯA CÓ MANIFEST`
- `design/report.md` chưa tồn tại (lần đầu viết `Write` toàn bộ theo Step 5.1)

> [!IMPORTANT]
> "Bỏ qua đọc lại" nghĩa là **không đụng vào phần report.md tương ứng file
> đó** (đúng tinh thần Step 5: "Mục không đổi → không đụng vào"), không phải
> tự tin sửa mà không kiểm tra. Nếu không chắc một mục trong report.md đến từ
> file nào, tra bằng dòng `*Nguồn: Research/plan/<file> §<mục>*` cuối mỗi mục.

## Step 1 — Đọc lại các file đã đổi

Với danh sách `changed` từ Step 0 (hoặc toàn bộ nếu rơi vào 3 trường hợp bắt
buộc ở trên), đọc **hết**, không đọc lướt, không suy đoán nội dung từ tên file:

- `Research/plan/README.md` — mục lục + 6 quyết định kiến trúc cốt lõi
- `Research/plan/01` → `09`
- `Research/tai-lieu-du-an-tarot-tong-hop.md` (nếu còn tồn tại)

Với `--section <n>`: đọc sâu file đó bất kể cache nói gì (người dùng đã chỉ
định rõ). README + 08-timeline vẫn theo quy tắc cache ở trên — chỉ đọc lại
nếu Step 0 báo `changed`, nếu không thì lấy số liệu tiến độ tổng bằng grep
checkbox (đã có sẵn ở khối "Đầu việc đã xong / tổng số") thay vì đọc lại toàn
văn.

> [!IMPORTANT]
> Nếu hai tài liệu mâu thuẫn (chi phí, mốc thời gian, schema, quyết định kiến
> trúc), **không tự chọn bên nào**. Ghi vào mục "Mâu thuẫn cần xác nhận".

## Step 2 — Tiến độ: đếm, rồi liệt kê từng đầu việc

Đây là phần quan trọng nhất. Trang này dùng để **quản lý tiến độ**, nên không
được dừng ở con số tổng.

### 2.1 Đếm theo giai đoạn

`Research/plan/08-timeline.md` là nguồn chính (11 giai đoạn). Cho mỗi giai đoạn:
đếm `- [x]` / tổng checkbox → phần trăm.

| Trạng thái | Điều kiện |
|---|---|
| ✅ Xong | 100% checkbox đã tick |
| 🔵 Đang làm | 1–99% |
| ⬜ Chưa bắt đầu | 0% |
| 🔴 Chặn | có mục gắn 🔴 chưa tick |

Giai đoạn 0% là **0%** — không làm tròn lên.

### 2.2 Liệt kê chi tiết — bắt buộc

Mỗi giai đoạn có **một bảng riêng liệt kê đủ mọi đầu việc**, không gộp, không
lược bớt, không viết "và các việc khác":

| Cột | Nội dung |
|---|---|
| Trạng thái | `✅` nếu đã tick, `⬜` nếu chưa (template tô màu theo hai ký tự này) |
| Đầu việc | **Nguyên văn** từ file kế hoạch — để đối chiếu 1-1, không diễn đạt lại |
| Ghi chú | 🔴 nếu là mục chặn · phụ thuộc · file tham chiếu trong kế hoạch |

Áp dụng cho **cả** 11 giai đoạn trong `08-timeline.md` **và** các checklist nằm
ngoài timeline (`05 §3.5`, `06 §1.1`, `06 §4.3`, `07 §7.2`, `09` ngắn hạn).

> [!CAUTION]
> Tổng số dòng liệt kê phải **khớp** với tổng số checkbox đếm được ở §2.1. Lệch
> một dòng nghĩa là có đầu việc bị bỏ quên — không ai theo dõi được thứ không
> xuất hiện trên bảng.

### 2.3 Thu thêm

- **Đường găng** (08 §2) — kèm sơ đồ mermaid và bảng điều kiện bắt đầu từng mắt xích
- **Ước tính thời gian** (08 §1, §4) — ngày công từng giai đoạn, tổng, và 4 hạng
  mục hay bị ước lượng thiếu
- **Phương án cắt phạm vi** (08 §5) — cắt gì, tiết kiệm bao nhiêu, đánh đổi gì,
  và danh sách **không được cắt**
- **Rủi ro** (08 §6) và mọi mục gắn 🔴 trong toàn bộ `Research/plan/`
- **Chi phí** (07) — đơn giá, chi phí/lượt, 3 phase, biên lợi nhuận, hòa vốn
- **Quyết định kiến trúc** (README) · **Kiến trúc AI 2 lớp** (03) · **Schema** (04)
- **Roadmap** (09)

## Step 3 — Đối chiếu kế hoạch với thực tế

Checkbox là **lời khai**, không phải bằng chứng:

```bash
.claude/hooks/detect-stack.sh
git log --oneline -20
git ls-files
```

| Tình huống | Cách xử lý |
|---|---|
| Đã tick nhưng repo không có dấu vết | Ghi theo kế hoạch, gắn cờ ⚠️ "chưa xác minh được trong repo" |
| Repo có việc chưa được tick | Nêu trong mục "Lệch kế hoạch ↔ repo", **không tự sửa file kế hoạch** |
| Không kiểm chứng được (dịch vụ ngoài) | `⏭️ chưa xác minh (lý do)` — tuyệt đối không ghi ✅ |

> [!CAUTION]
> Một con số tiến độ thổi phồng gây thiệt hại lớn hơn nhiều so với một ô ghi
> "chưa xác minh".

## Step 4 — Cấu trúc `design/report.md`

Markdown là nội dung trang. Heading `##` và `###` tự động thành mục lục bên trái.

| § | Mục | Bắt buộc có |
|---|---|---|
| 1 | Tổng quan | Bảng chỉ số: tiến độ tổng, giai đoạn hiện tại, ngày công còn lại, blocker, mâu thuẫn |
| 2 | Timeline & tiến độ | Bảng tổng 11 giai đoạn **+ bảng chi tiết từng đầu việc của từng giai đoạn** (§2.2) |
| 3 | Đường găng | Sơ đồ mermaid + bảng điều kiện bắt đầu |
| 4 | Ước tính & cắt phạm vi | Ngày công, 4 hạng mục hay thiếu, phương án cắt, danh sách không được cắt |
| 5 | Blocker & rủi ro | Mục 🔴 + bảng rủi ro kèm giảm thiểu |
| 6 | Quyết định kiến trúc | 6 quyết định cốt lõi |
| 7 | Kiến trúc & stack | Sơ đồ AI 2 lớp + bảng stack + 6 bảng dữ liệu |
| 8 | Chi phí | Chi phí/lượt, 3 phase, biên lợi nhuận, hòa vốn |
| 9 | Roadmap | Bảng ưu tiên + cân nhắc không làm |
| 10 | Lệch kế hoạch ↔ repo | Kết quả Step 3 + mâu thuẫn tài liệu |
| 11 | Việc nên làm tiếp | 3–5 việc, xếp thứ tự, kèm lý do "vì sao bây giờ" |

Quy ước viết:
- Mỗi mục kết thúc bằng dòng `*Nguồn: Research/plan/<file> §<mục>*`
- Dùng `✅` / `⬜` cho trạng thái — template tự tô màu
- Sơ đồ mermaid: xuống dòng bằng `\n`, **không dùng `<br/>`** (template lưu source
  vào `data-src` rồi gán lại bằng `innerHTML`, `<br/>` sẽ bị parse thành thẻ thật
  ở lần render thứ hai và làm vỡ sơ đồ)

## Step 5 — Cập nhật, chứ không viết mới

> [!IMPORTANT]
> Đây là quy tắc quan trọng nhất của lần chạy thứ hai trở đi.

### 5.1 `design/report.md`

| Tình huống | Hành động |
|---|---|
| File **chưa có** | `Write` toàn bộ |
| File **đã có** | **Chỉ dùng `Edit`** cho đúng những mục có thay đổi |

Đọc file hiện tại trước. So từng mục với dữ liệu vừa thu được ở Step 1–3:

- Số liệu đổi (checkbox mới tick, chi phí, ngày công) → `Edit` đúng dòng đó
- Có đầu việc mới trong kế hoạch → **bổ sung dòng**, không dựng lại cả bảng
- Mục không đổi → **không đụng vào**
- Người dùng tự thêm ghi chú → **giữ nguyên**, tuyệt đối không xóa

### 5.2 `design/index.html`

| Tình huống | Hành động |
|---|---|
| File **chưa có** (hoặc rỗng, hoặc `--rebuild`) | Dựng mới từ `template/gdd_template.md` |
| File **đã có** | **Chỉ thay khối markdown nhúng + dấu thời gian.** Giữ nguyên toàn bộ phần vỏ HTML |

```bash
python3 .claude/scripts/build-report.py            # tự chọn chế độ theo file đang có
python3 .claude/scripts/build-report.py --rebuild   # ép dựng lại từ template
```

Lý do tách hai chế độ: vỏ HTML có thể đã được chỉnh tay (đổi màu, thêm mục,
sửa tiêu đề). Dựng lại từ template sẽ xóa sạch những chỉnh sửa đó. Chỉ dựng lại
khi người dùng yêu cầu rõ ràng bằng `--rebuild`.

Với `--dry-run`: in ra danh sách thay đổi sẽ áp dụng, **không đụng vào file nào**.

### 5.3 Ghi lại cache cho lần chạy sau

Sau khi `design/report.md` đã cập nhật xong (bỏ qua nếu `--dry-run`):

```bash
python3 .claude/scripts/report-cache.py --commit
```

Lệnh này ghi lại hash hiện tại của toàn bộ `Research/plan/*.md` — kể cả các
file "unchanged" đã bỏ qua ở Step 0. Không chạy bước này thì lần `/report`
sau sẽ không có cache để so sánh và phải đọc lại từ đầu.

`--reset`: xóa cache (`python3 .claude/scripts/report-cache.py --reset`) rồi
dừng — dùng khi nghi ngờ `report.md` đã lệch khỏi nguồn thật và muốn lần
`/report` tiếp theo đọc lại toàn bộ để đối chiếu từ đầu.

## Step 6 — Verify

Dự án tĩnh, không `package.json` → bỏ qua gate 1–4. Gate 5 và 6 **vẫn áp dụng**.

Trang dùng script từ CDN (marked, mermaid, svg-pan-zoom) theo đúng template —
**cần mạng để render**. Kiểm tra bằng trình duyệt thật:

```bash
open design/index.html
```

- [ ] Markdown render xong (không còn chữ "Đang render…")
- [ ] Mục lục trái đủ mục, scrollspy chạy
- [ ] Sơ đồ mermaid hiện đúng, **và vẫn đúng sau khi bấm đổi theme**
- [ ] Tìm kiếm nhảy đúng kết quả
- [ ] 375 / 768 / 1280px — không cuộn ngang; bảng cuộn trong khung riêng
- [ ] Cả 2 theme

Báo cáo đúng block trong `.claude/rules/verification.md`:

```markdown
### Verification
| Gate | Result |
|------|--------|
| lint | n/a (static) |
| typecheck | n/a (static) |
| test | n/a (static) |
| build | ✅ build-report.py |
| visual (375/768/1280) | ✅ / ⏭️ skipped: <lý do> |
| a11y (keyboard + contrast) | ✅ / ⏭️ skipped: <lý do> |
```

Không mở được trang thì ghi `⏭️ skipped` kèm lý do — không ghi ✅.

## Step 7 — Tóm tắt trong chat

```markdown
## 📊 Báo cáo dự án — <ngày>

- Tiến độ tổng: X% (Y/Z đầu việc)
- Giai đoạn hiện tại: <tên>
- Blocker: N · Rủi ro cao: M · Mâu thuẫn tài liệu: K
- Chưa xác minh được trong repo: J mục

### Thay đổi so với lần chạy trước
- <mục>: <đổi gì>          ← hoặc "không có thay đổi"
```

Kèm 3–5 dòng: điều đáng lo nhất lúc này, và việc kế tiếp nên làm.

> [!NOTE]
> `design/` là git repo riêng (remote `nts_tarot_design`) và nằm trong
> `.gitignore` của repo gốc. `/commit` ở repo gốc **không** commit trang này —
> nhắc người dùng commit riêng.
