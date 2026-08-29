const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");

async function checkSignatures() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("=== THỬ GỌI CÁC SIGNATURE CỦA CREDIT_ORDER ===");
  
  // Test p_order_code and p_amount
  const res1 = await supabase.rpc("credit_order", {
    p_order_code: 999012358,
    p_amount: 49000,
  });
  console.log("credit_order(p_order_code, p_amount):", res1.error ? res1.error.message : "Thành công, data: " + res1.data);

  // Test debit_reading
  const res2 = await supabase.rpc("debit_reading", {
    p_user_id: "65a4917d-c2aa-40d1-918c-ec98b6f07d5a",
    p_reading_id: "00000000-0000-0000-0000-000000000001",
    p_cost: 2
  });
  console.log("debit_reading(p_user_id, p_reading_id, p_cost):", res2.error ? res2.error.message : "Thành công!");

  // Clean test order
  await supabase.from("orders").delete().eq("payos_order_code", 999012358);
}

checkSignatures();
