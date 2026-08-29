const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Vui lòng cấu hình NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong file .env.local");
  process.exit(1);
}

const baseContentPath = path.join(__dirname, "base-content/output/base-content.json");
const baseContent = JSON.parse(fs.readFileSync(baseContentPath, "utf8"));

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log(`Đang nạp ${baseContent.length} tổ hợp giải nghĩa vào bảng base_content của Supabase...`);
  
  // Batch upsert by 100 rows
  const chunkSize = 100;
  for (let i = 0; i < baseContent.length; i += chunkSize) {
    const chunk = baseContent.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("base_content")
      .upsert(chunk, { onConflict: "card_id,orientation,topic" });

    if (error) {
      console.error(`Lỗi nạp chunk ${i} - ${i + chunk.length}:`, error.message);
    } else {
      console.log(`Đã nạp ${Math.min(i + chunkSize, baseContent.length)} / ${baseContent.length} rows...`);
    }
  }

  console.log("Hoàn tất nạp dữ liệu base_content vào Supabase!");
}

main().catch((err) => {
  console.error("Lỗi khi nạp dữ liệu:", err);
  process.exit(1);
});
