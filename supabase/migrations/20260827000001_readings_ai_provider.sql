-- ============================================================
-- Multi-provider AI cho Lớp Cá nhân (Đọc sâu) — thêm cột để phân biệt
-- Anthropic/OpenAI/Gemini khi so sánh chất lượng model sau này.
-- ============================================================

alter table readings add column ai_provider text;

comment on column readings.ai_provider is
  'anthropic | openai | gemini — nhà cung cấp AI dùng cho personal_body';

-- Backfill dữ liệu cũ: mọi reading có personal_body trước khi tính năng này
-- tồn tại đều chạy qua Anthropic (nhà cung cấp duy nhất lúc đó).
update readings set ai_provider = 'anthropic'
  where ai_provider is null and model is not null;
