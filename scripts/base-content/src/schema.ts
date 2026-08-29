// zod/v4: SDK 0.116's zodOutputFormat() (helpers/zod.js) types its param as
// z.ZodType from 'zod/v4', not the classic 'zod' (v3) export — the two are
// structurally incompatible even on the same zod package version. Using the
// plain 'zod' import here fails tsc against the SDK's structured-output
// helper. Builder API (z.object/z.string/z.array/.min/.max) is unchanged.
import { z } from 'zod/v4'

// Structured output schema cho mỗi tổ hợp Lớp Nền — truyền qua
// `output_config.format` (xem generate.ts). Validate lại sau khi nhận kết quả
// batch, phòng trường hợp structured output không khớp schema tuyệt đối.
export const BaseContentSchema = z.object({
  summary: z.string().min(1),
  body: z.string().min(1),
  keywords: z.array(z.string()).min(3).max(8),
})

export type BaseContent = z.infer<typeof BaseContentSchema>
