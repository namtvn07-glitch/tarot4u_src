const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

async function clean() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from("credit_ledger").delete().eq("ref_id", "00000000-0000-0000-0000-000000000001");
  await supabase.from("profiles").update({ credits: 92 }).eq("id", "65a4917d-c2aa-40d1-918c-ec98b6f07d5a");
  console.log("✓ Đã hoàn nguyên số dư tài khoản về 92 credits!");
}

clean();
