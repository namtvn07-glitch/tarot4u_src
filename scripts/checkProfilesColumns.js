const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

async function checkProfilesColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("=== THỬ TRUY VẤN SELECT * FROM PROFILES ===");
  const { data, error } = await supabase.from("profiles").select("*").limit(5);
  if (error) {
    console.error("Lỗi:", error.message);
  } else {
    console.log("Dữ liệu profiles:", data);
  }
}

checkProfilesColumns();
