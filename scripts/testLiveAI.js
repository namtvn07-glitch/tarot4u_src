const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenAI } = require("@google/genai");

async function testSupabase() {
  console.log("=== 1. TEST SUPABASE REAL DATABASE ===");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("base_content")
    .select("card_id, orientation, topic, summary")
    .eq("card_id", "the-fool")
    .eq("orientation", "upright")
    .eq("topic", "love")
    .single();

  if (error) {
    console.error("Lỗi truy vấn Supabase:", error.message);
  } else {
    console.log("✓ Truy vấn thành công base_content từ Supabase thật:", data);
  }
}

async function testGeminiAI() {
  console.log("\n=== 2. TEST GEMINI REAL AI PROVIDER ===");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("Chưa có GEMINI_API_KEY");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: "Hãy viết 1 câu thông điệp chiêm nghiệm ngắn cho lá bài The Fool trong tiếng Việt.",
    });

    console.log("✓ Kết nối Gemini AI thật thành công!");
    console.log("Nội dung AI trả về:", response.text);
  } catch (err) {
    console.error("Lỗi kết nối Gemini AI:", err.message);
  }
}

async function run() {
  await testSupabase();
  await testGeminiAI();
}

run();
