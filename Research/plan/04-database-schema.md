# 04 — Database Schema

## 1. Tổng quan các bảng

| Bảng | Vai trò | Số dòng dự kiến |
|---|---|---|
| `profiles` | Hồ sơ user, số dư credits hiện tại | = số user |
| `base_content` | Lớp Nền sinh sẵn (lá × hướng × chủ đề) | 780, cố định |
| `readings` | Lịch sử trải bài | Tăng theo lưu lượng |
| `orders` | Đơn thanh toán PayOS | = số lượt nạp |
| `credit_ledger` | **Sổ cái mọi thay đổi credits** | = số giao dịch + số lượt Đọc sâu |
| `rate_limits` | Bộ đếm rate limit (Phase 1) | Tạm thời, dọn theo giờ |

Hai lựa chọn cần biết trước khi đọc phần sau:

- **Không có bảng `cards`.** 78 lá bài nằm trong `data/cards.json` — dữ liệu không bao giờ đổi, để trong repo thì SSG được, bớt một round-trip mỗi request, và review được qua git. Xem §7.
- **`profiles.credits` không bao giờ được sửa trực tiếp.** Nó là bản chiếu (projection) của `credit_ledger`, luôn cập nhật qua Postgres function trong cùng transaction với dòng ledger tương ứng.

## 2. Schema đầy đủ

### 2.1 profiles

```sql
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url   text,
  credits      int not null default 0 check (credits >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

`check (credits >= 0)` là lưới an toàn cuối cùng — nếu logic trừ credits có bug, DB sẽ từ chối thay vì để số âm trôi qua.

Trigger tạo profile tự động khi có user mới:

```sql
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### 2.2 base_content — Lớp Nền sinh sẵn

```sql
create table base_content (
  id          uuid primary key default gen_random_uuid(),
  card_id     text not null,                 -- khớp id trong data/cards.json
  orientation text not null check (orientation in ('upright', 'reversed')),
  topic       text not null check (topic in
                ('love','career','money','mind','general')),
  body        text not null,                 -- nội dung diễn giải nền
  summary     text not null,                 -- 1 câu tóm tắt, dùng cho card preview
  keywords    text[] not null default '{}',  -- truyền vào Lớp Cá nhân
  model       text not null,                 -- model đã sinh, để truy vết
  generated_at timestamptz not null default now(),
  version     int not null default 1         -- tăng khi sinh lại nội dung
);

-- BẮT BUỘC: không có index này thì lookup là full-scan và bản trùng sẽ tích tụ
create unique index base_content_lookup
  on base_content (card_id, orientation, topic);
```

780 dòng. Đọc bằng một `SELECT` duy nhất, không tốn API call.

### 2.3 readings — lịch sử trải bài

```sql
create table readings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade,  -- null = khách vãng lai
  topic         text not null,
  spread        text not null check (spread in ('one_card', 'three_card')),
  tier          text not null check (tier in ('quick', 'deep')),
  cards_drawn   jsonb not null,   -- [{card_id, orientation, position}]
  question      text,             -- câu hỏi user, null nếu không nhập
  personal_body text,             -- Lớp Cá nhân; null với tier='quick'
  model         text,             -- model đã dùng cho Lớp Cá nhân
  input_tokens  int,              -- để đối soát chi phí thật
  output_tokens int,
  created_at    timestamptz not null default now()
);

-- Trang lịch sử: lấy trải bài của tôi, mới nhất trước
create index readings_user_recent on readings (user_id, created_at desc);

-- Phân tích: lá nào hay ra, chủ đề nào phổ biến
create index readings_topic_created on readings (topic, created_at desc);
```

Lưu `input_tokens`/`output_tokens` cho phép **đối soát chi phí thật với hóa đơn Anthropic**. Rất đáng giá khi cần tìm hiểu tại sao hóa đơn cao hơn dự tính — không có nó thì chỉ đoán.

### 2.4 orders — đơn thanh toán

```sql
create table orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete restrict,
  amount_vnd        int not null check (amount_vnd > 0),
  credits_purchased int not null check (credits_purchased > 0),
  status            text not null default 'pending'
                    check (status in ('pending','paid','failed','expired','cancelled')),
  payos_order_code  bigint not null,      -- PayOS yêu cầu số nguyên
  paid_at           timestamptz,
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Chống trùng: mỗi mã đơn PayOS chỉ tồn tại một lần
create unique index orders_payos_code on orders (payos_order_code);

create index orders_user_recent on orders (user_id, created_at desc);

-- Cron dọn đơn hết hạn
create index orders_pending_expiry on orders (expires_at) where status = 'pending';
```

> `on delete restrict` cho `user_id`: không cho xóa user còn đơn hàng. Dữ liệu tài chính phải giữ lại để đối soát, kể cả khi user yêu cầu xóa tài khoản (xóa PII trong `profiles`, giữ `orders`).

### 2.5 credit_ledger — sổ cái

Bảng quan trọng nhất trong phần tiền. **Mọi thay đổi credits đều phải đi qua đây.**

```sql
create table credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete restrict,
  delta      int  not null check (delta <> 0),   -- dương = cộng, âm = trừ
  balance_after int not null,                    -- số dư sau giao dịch, để đối soát
  reason     text not null check (reason in
               ('purchase','reading','refund','bonus','admin_adjust')),
  ref_id     uuid,                               -- order_id hoặc reading_id
  note       text,
  created_at timestamptz not null default now()
);

-- Chống cộng/trừ 2 lần cho cùng một sự kiện
create unique index credit_ledger_idem
  on credit_ledger (reason, ref_id)
  where ref_id is not null;

create index credit_ledger_user_recent
  on credit_ledger (user_id, created_at desc);
```

Unique index này là **cơ chế chống trùng chính**: nếu PayOS gọi webhook 3 lần cho cùng một đơn, hai lần sau sẽ vi phạm unique constraint và bị bỏ qua an toàn.

**Đối soát:** `profiles.credits` phải luôn bằng `sum(delta)` trong ledger. Chạy kiểm tra định kỳ:

```sql
select p.id, p.credits, coalesce(sum(l.delta), 0) as ledger_sum
from profiles p
left join credit_ledger l on l.user_id = p.id
group by p.id, p.credits
having p.credits <> coalesce(sum(l.delta), 0);
```

Query này phải luôn trả về 0 dòng. Nếu không, có bug ở đâu đó — điều tra ngay.

### 2.6 rate_limits — Phase 1, không cần dependency mới

```sql
create table rate_limits (
  key        text not null,          -- 'ip:1.2.3.4' hoặc 'user:<uuid>'
  window_start timestamptz not null,
  count      int not null default 1,
  primary key (key, window_start)
);

create index rate_limits_cleanup on rate_limits (window_start);
```

Xem [06](06-bao-mat-kiem-duyet-phap-ly.md) cho hàm kiểm tra. Từ Phase 2, chuyển sang Upstash Redis cho nhanh hơn.

## 3. Row Level Security

**Bật RLS cho mọi bảng có dữ liệu người dùng.** Đây là gate, không phải tùy chọn.

```sql
alter table profiles      enable row level security;
alter table readings      enable row level security;
alter table orders        enable row level security;
alter table credit_ledger enable row level security;
alter table base_content  enable row level security;
alter table rate_limits   enable row level security;
```

### Policies

```sql
-- profiles: user đọc/sửa hồ sơ của chính mình.
-- KHÔNG cho update cột credits (xem trigger chặn ở dưới).
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- readings: chỉ đọc trải bài của mình
create policy readings_select_own on readings
  for select using (auth.uid() = user_id);

-- orders: chỉ đọc đơn của mình. KHÔNG có policy insert/update
-- → client không tự tạo/sửa đơn được, mọi thứ đi qua service role
create policy orders_select_own on orders
  for select using (auth.uid() = user_id);

-- credit_ledger: chỉ đọc. Ghi luôn qua service role.
create policy ledger_select_own on credit_ledger
  for select using (auth.uid() = user_id);

-- base_content: ai cũng đọc được (nội dung công khai), không ai ghi qua client
create policy base_content_read_all on base_content
  for select using (true);

-- rate_limits: không policy nào → client không truy cập được
```

### Chặn client tự sửa credits

RLS policy `profiles_update_own` cho phép update, mà `credits` nằm trong cùng bảng. Cần chặn riêng:

```sql
create function guard_credits_column() returns trigger
language plpgsql as $$
begin
  -- service role bỏ qua kiểm tra này
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' then
    return new;
  end if;
  if new.credits is distinct from old.credits then
    raise exception 'credits chỉ được thay đổi server-side';
  end if;
  return new;
end $$;

create trigger profiles_guard_credits
  before update on profiles
  for each row execute function guard_credits_column();
```

> Không có trigger này, RLS `for update using (auth.uid() = id)` cho phép user tự set `credits = 99999`. Đây là lỗ hổng dễ bỏ sót nhất trong Supabase.

## 4. Nguyên tắc dùng service role key

| Thao tác | Client (anon key) | Server (service role) |
|---|---|---|
| Đọc profile của mình | ✅ | |
| Đọc lịch sử của mình | ✅ | |
| Đọc `base_content` | ✅ | |
| Tạo order | | ✅ |
| Cộng credits | | ✅ |
| Trừ credits | | ✅ |
| Ghi ledger | | ✅ |
| Ghi `readings` | | ✅ |
| Ghi `base_content` (batch) | | ✅ |

`SUPABASE_SERVICE_ROLE_KEY` **chỉ tồn tại trong API routes**, không bao giờ có tiền tố `NEXT_PUBLIC_`.

## 5. Migration

Dùng Supabase CLI, versioned migration, commit vào repo:

```
supabase/migrations/
  20260802000001_initial_schema.sql
  20260802000002_rls_policies.sql
  20260802000003_credit_functions.sql
  20260802000004_seed_base_content_table.sql
```

**Không** sửa schema qua Dashboard UI ở production — thay đổi sẽ không được ghi lại và môi trường sẽ trôi khỏi repo.

## 6. Backup

Supabase Pro có point-in-time recovery. Ngoài ra, xuất định kỳ 2 bảng không thể sinh lại:

| Bảng | Sinh lại được không | Backup |
|---|---|---|
| `base_content` | ✅ chạy lại batch (~$5) | Nên có, tiết kiệm tiền và thời gian |
| `readings` | ❌ | **Bắt buộc** |
| `orders` + `credit_ledger` | ❌ | **Bắt buộc** — dữ liệu tài chính |
| `profiles` | ❌ | **Bắt buộc** |

Cron hàng tuần dump `orders` + `credit_ledger` ra storage ngoài Supabase.

## 7. `data/cards.json` — thay cho bảng `cards`

```json
[
  {
    "id": "major-00-fool",
    "slug": "the-fool",
    "name": "The Fool",
    "nameVi": "Gã Khờ",
    "arcana": "major",
    "number": 0,
    "image": "/cards/major-00-fool.jpg",
    "keywordsUpright": ["khởi đầu", "tự do", "ngây thơ", "phiêu lưu"],
    "keywordsReversed": ["liều lĩnh", "thiếu chuẩn bị", "do dự"]
  }
]
```

Lợi ích so với để trong DB:
- 78 trang SSG build được ở thời điểm build, không cần query
- Không tốn round-trip DB ở luồng trải bài
- Type-safe: sinh type TypeScript từ JSON
- Version control: đổi mô tả lá bài là một commit, review được

---

**Tiếp theo:** [05-thanh-toan-credits.md](05-thanh-toan-credits.md)
