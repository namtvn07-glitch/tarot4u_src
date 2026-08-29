// Import output/base-content.json vào bảng `base_content` của Supabase.
//
// KHÔNG CHẠY FILE NÀY cho tới khi Phase 3 có Supabase project thật + migration
// tạo bảng `base_content` (với `unique index base_content_lookup (card_id,
// orientation, topic)`, xem Research/plan/04-database-schema.md) đã áp dụng.
// Viết sẵn ở đây để không chặn Phase 3 sau này — chạy `npm run import` khi
// điều kiện trên đã đủ.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

import baseContent from '../output/base-content.json' with { type: 'json' }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env — chỉ điền sau khi Phase 3 có Supabase project thật.',
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  // upsert trên đúng cột của unique index base_content_lookup — an toàn để
  // chạy lại khi sửa một phần nội dung sau này, không tạo bản trùng.
  const { error } = await supabase
    .from('base_content')
    .upsert(baseContent, { onConflict: 'card_id,orientation,topic' })

  if (error) throw error
  console.log(`Imported ${baseContent.length} rows`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
