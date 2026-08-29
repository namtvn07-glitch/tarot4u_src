const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

async function listProfiles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("=== DANH SÁCH USERS TRONG SUPABASE THẬT ===");
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, credits, full_name, created_at");

  if (error) {
    console.error("Lỗi:", error.message);
    return;
  }

  console.log("Profiles found in database:");
  console.table(profiles);

  // Check auth.users table via admin
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (!authErr) {
    console.log("Auth users list:");
    authUsers.users.forEach((u) => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
    });
  }
}

listProfiles();
