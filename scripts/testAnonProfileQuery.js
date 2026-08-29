const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

async function testUserQuery() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log("=== KIỂM TRA TRUY VẤN VỚI ANON CLIENT ===");
  // Query with service role or user
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, credits, display_name, avatar_url")
    .eq("id", "65a4917d-c2aa-40d1-918c-ec98b6f07d5a")
    .single();

  if (error) {
    console.error("Lỗi:", error.message);
  } else {
    console.log("✓ Truy vấn thành công thông tin user:");
    console.log(`- ID: ${profile.id}`);
    console.log(`- Tên: ${profile.display_name}`);
    console.log(`- Credits: ${profile.credits}`);
  }
}

testUserQuery();
