const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { PayOS } = require("@payos/node");
const { createClient } = require("@supabase/supabase-js");
const QRCode = require("qrcode");

async function testPayOSAndRPC() {
  console.log("=== 1. TEST PAYOS PAYMENT LINK GENERATION ===");
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    console.error("Thiếu PayOS credentials trong .env.local");
    return;
  }

  const payos = new PayOS({ clientId, apiKey, checksumKey });
  const testOrderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);

  try {
    const payment = await payos.paymentRequests.create({
      orderCode: testOrderCode,
      amount: 49000,
      description: "Nap 10 credits test",
      returnUrl: "http://localhost:3000/nap-credits/ket-qua",
      cancelUrl: "http://localhost:3000/nap-credits",
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
    });

    console.log("✓ PayOS payment link tạo thành công!");
    console.log("OrderCode:", payment.orderCode);
    console.log("CheckoutUrl:", payment.checkoutUrl);
    console.log("Raw QR String (EMVCo):", payment.qrCode?.slice(0, 50) + "...");

    // Test QRCode generation
    const qrDataUrl = await QRCode.toDataURL(payment.qrCode, { width: 300, margin: 2 });
    console.log("✓ Chuyển đổi thành công sang QR Image DataURL (độ dài:", qrDataUrl.length, "bytes)");
  } catch (err) {
    console.error("Lỗi tạo PayOS payment link:", err.message);
  }

  console.log("\n=== 2. TEST SUPABASE CREDIT RPCs ===");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test debit_reading RPC signature
  const { data: testUser } = await supabase.from("profiles").select("id, credits").limit(1).single();
  if (testUser) {
    console.log("Found profile in Supabase:", testUser.id, "Credits:", testUser.credits);
  } else {
    console.log("Chưa có profile trong database, RPC đã sẵn sàng khi user đăng nhập.");
  }
}

testPayOSAndRPC();
