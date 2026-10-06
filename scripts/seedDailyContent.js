// Nạp nội dung Daily (scripts/daily-content/output/daily-content.json, do
// `node scripts/daily-content/merge.mts` ghi ra) vào bảng daily_content.
//
//   node scripts/seedDailyContent.js            nạp với status 'draft' (API CHƯA dùng)
//   node scripts/seedDailyContent.js --approve  nạp với status 'approved' (API dùng ngay)
//   node scripts/seedDailyContent.js --dry      chỉ in số bản + project đích, KHÔNG ghi gì
//
// Chạy lại bao nhiêu lần cũng được (upsert theo card_id+orientation+variant+version).
// Chỉ ghi vào bảng daily_content — không đụng bảng nào khác.
//
// Local: NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<key> node ...
// (xem docs/learned/supabase.md — supabase start không seed gì).
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY (đặt trong .env.local hoặc biến môi trường).");
  process.exit(1);
}

const status = process.argv.includes("--approve") ? "approved" : "draft";
const sourcePath = path.join(__dirname, "daily-content/output/daily-content.json");
if (!fs.existsSync(sourcePath)) {
  console.error(`Chưa có ${sourcePath} — chạy "node scripts/daily-content/merge.mts" trước.`);
  process.exit(1);
}
const rows = JSON.parse(fs.readFileSync(sourcePath, "utf8")).map((row) => ({ ...row, status }));

// In rõ project đích TRƯỚC khi ghi: .env.local có thể trỏ vào production hoặc local.
const targetHost = new URL(supabaseUrl).host;
console.log(`Project đích : ${targetHost}`);
console.log(`Số bản       : ${rows.length}`);
console.log(`Status       : ${status}`);
if (process.argv.includes("--dry")) {
  console.log("--dry: không ghi gì.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Đang nạp ${rows.length} bản Daily vào daily_content với status '${status}'...`);
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("daily_content")
      .upsert(chunk, { onConflict: "card_id,orientation,variant,version" });
    if (error) {
      console.error(`Lỗi nạp ${i}–${i + chunk.length}:`, error.message);
      process.exit(1);
    }
    console.log(`Đã nạp ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
  }
  console.log("Hoàn tất.");
}

main().catch((error) => {
  console.error("Lỗi khi nạp dữ liệu:", error);
  process.exit(1);
});
