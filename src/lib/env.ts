import { z } from "zod";

// Secret thật (service role, token ký HMAC, cron auth) KHÔNG được có default
// ở production — một default hợp lệ về mặt schema là một secret đoán được,
// biến "validate lúc khởi động để lỗi cấu hình nổ sớm" (02-tech-stack.md §5)
// thành "âm thầm chạy production với secret giả". Default chỉ áp dụng ở dev
// local để không bắt buộc set .env.local đầy đủ khi mới clone repo.
const isProd = process.env.NODE_ENV === "production";

const fieldSchemas = {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder-supabase.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: isProd
    ? z.string().min(1)
    : z.string().min(1).default("placeholder-service-role-key"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["anthropic", "openai", "gemini"]).default("gemini"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-3-5-sonnet-20241022"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-1.5-pro"),
  
  TRIAGE_AI_PROVIDER: z.enum(["anthropic", "openai", "gemini"]).default("gemini"),
  TRIAGE_ANTHROPIC_API_KEY: z.string().min(1).optional(),
  TRIAGE_ANTHROPIC_MODEL: z.string().min(1).default("claude-3-5-haiku-20241022"),
  TRIAGE_OPENAI_API_KEY: z.string().min(1).optional(),
  TRIAGE_OPENAI_MODEL: z.string().min(1).optional(),
  TRIAGE_GEMINI_API_KEY: z.string().min(1).optional(),
  TRIAGE_GEMINI_MODEL: z.string().min(1).optional(),
  
  READING_TOKEN_SECRET: isProd
    ? z.string().min(16)
    : z.string().min(16).default("dev-reading-secret-key-32-chars-minimum-safe"),
  DEEP_READING_COST: z.coerce.number().int().positive().default(2),
  DEEP_SPREAD_SLOTS: z.coerce.number().int().positive().default(24),

  PAYOS_CLIENT_ID: z.string().min(1).optional(),
  PAYOS_API_KEY: z.string().min(1).optional(),
  PAYOS_CHECKSUM_KEY: z.string().min(1).optional(),
  CRON_SECRET: isProd
    ? z.string().min(16)
    : z.string().min(16).default("dev-cron-secret-key-16-chars-min"),
} as const;

type FieldSchemas = typeof fieldSchemas;
type Env = { [K in keyof FieldSchemas]: z.infer<FieldSchemas[K]> };

const RAW_ENV: Record<keyof Env, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  TRIAGE_AI_PROVIDER: process.env.TRIAGE_AI_PROVIDER,
  TRIAGE_ANTHROPIC_API_KEY: process.env.TRIAGE_ANTHROPIC_API_KEY,
  TRIAGE_ANTHROPIC_MODEL: process.env.TRIAGE_ANTHROPIC_MODEL,
  TRIAGE_OPENAI_API_KEY: process.env.TRIAGE_OPENAI_API_KEY,
  TRIAGE_OPENAI_MODEL: process.env.TRIAGE_OPENAI_MODEL,
  TRIAGE_GEMINI_API_KEY: process.env.TRIAGE_GEMINI_API_KEY,
  TRIAGE_GEMINI_MODEL: process.env.TRIAGE_GEMINI_MODEL,
  READING_TOKEN_SECRET: process.env.READING_TOKEN_SECRET,
  DEEP_READING_COST: process.env.DEEP_READING_COST,
  DEEP_SPREAD_SLOTS: process.env.DEEP_SPREAD_SLOTS,
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
  PAYOS_API_KEY: process.env.PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
};

const cache = new Map<keyof Env, unknown>();

function loadField<K extends keyof Env>(key: K): Env[K] {
  if (cache.has(key)) return cache.get(key) as Env[K];
  const schema = fieldSchemas[key];
  const value = schema.parse(RAW_ENV[key]) as Env[K];
  cache.set(key, value);
  return value;
}

export const env = new Proxy({} as Env, {
  get: (_target, prop: keyof Env) => loadField(prop),
});
