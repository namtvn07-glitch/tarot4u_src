// In "bản giao việc" cho một chunk — dán/đưa cho agent sinh nội dung.
//   node scripts/daily-content/print-brief.mts <số thứ tự chunk> [cardsPerChunk=3]
//   node scripts/daily-content/print-brief.mts --list          liệt kê các chunk
import { SAFETY_PREAMBLE } from "../../src/lib/ai/prompts/safety.ts";
import { DAILY_PROMPT_BODY } from "./prompt-body.ts";
import {
  ORIENTATIONS,
  VARIANTS_PER_COMBO,
  buildChunks,
  cardById,
  keywordsFor,
} from "./combos.mts";

const args = process.argv.slice(2);
const cardsPerChunk = Number(args[1]) || 3;
const chunks = buildChunks(cardsPerChunk);

if (args[0] === "--list") {
  chunks.forEach((c) => console.log(`${c.chunkId}: ${c.cardIds.join(", ")}`));
  process.exit(0);
}

const index = Number(args[0]);
const chunk = chunks[index - 1];
if (!chunk) throw new Error(`Chunk ${args[0]} không tồn tại (có ${chunks.length} chunk)`);

const jobLines = chunk.cardIds.flatMap((cardId) => {
  const card = cardById(cardId);
  return ORIENTATIONS.flatMap((orientation) =>
    Array.from({ length: VARIANTS_PER_COMBO }, (_, i) => {
      const variant = i + 1;
      return [
        `- card_id: ${card.id} | orientation: ${orientation} | variant: ${variant}`,
        `    card_name: ${card.name_vi} (${card.name_en}) | card_number: ${card.number}`,
        `    arcana_type: ${card.arcana === "major" ? "Major" : "Minor"} | suit: ${card.suit ?? "—"}`,
        `    orientation (Upright/Reversed): ${orientation === "upright" ? "Upright" : "Reversed"}`,
        `    keywords: ${keywordsFor(card, orientation).join(", ")}`,
      ].join("\n");
    }),
  );
});

console.log(`# Nhiệm vụ: sinh nội dung Daily — ${chunk.chunkId}

Bạn là người viết nội dung cho sản phẩm Xem Bài Tarot. Hãy đóng vai VENTUS theo bản prompt bên dưới.

Prompt này vốn viết cho MỘT lượt gọi runtime ("Bạn sẽ nhận: card_name..."). Ở đây bạn sinh hàng loạt:
mỗi mục trong DANH SÁCH VIỆC là một lượt, đầu vào chính là các trường ghi sẵn ở mục đó.

## Quy tắc bổ sung cho sinh hàng loạt

1. Mỗi việc → đúng 1 object JSON theo "OUTPUT JSON" của prompt (KHÔNG có trường "disclaimer"), cộng 3 trường:
   "card_id" (đúng như trong danh sách), "orientation" ("upright" hoặc "reversed", chữ thường) và
   "variant" (số nguyên đúng như trong danh sách).
2. "card.arcana" là "Major" hoặc "Minor"; "card.orientation" là "Upright" hoặc "Reversed" (viết hoa chữ đầu);
   "card.name" là tên tiếng Việt của lá.
3. Bạn không biết ngày: không nhắc ngày/thứ/tháng cụ thể, không viết "hôm nay là thứ…".
4. ${VARIANTS_PER_COMBO} biến thể của cùng một (lá, chiều) phải KHÁC NHAU thật sự: khác góc nhìn chính, khác
   headline, khác memorable_message, khác ví dụ trong forecast. Không đổi vài từ rồi chép lại. Điểm số giữ gần
   nhau (chênh tối đa 1) vì chúng mô tả cùng một lá — hệ thống sẽ chuẩn hoá về trung vị.
5. Chữ thuần: không markdown, không dùng các ký tự * # _ \` [ ] trong nội dung.
6. Chỉ dùng các từ khoá được cung cấp làm điểm tựa, không bịa ý nghĩa trái với lá bài.
7. Mỗi đoạn (love, career, finance, insight, advice) tối đa 3 câu. Tổng nội dung 250–350 từ.
8. Mỗi lá có 2 chiều: viết chiều ngược như một góc đọc riêng (bóng của lá, năng lượng bị chặn, hướng vào trong…),
   không mặc định là "xấu".

9. Bám giọng văn của bản mẫu: đọc 4–6 mục đầu trong scripts/daily-content/output/chunks/chunk-01.json
   (The Fool, The Magician) TRƯỚC khi viết. Học giọng điệu, độ cụ thể và độ dài — KHÔNG sao chép câu chữ,
   mô-típ hình ảnh hay cấu trúc memorable_message của bản mẫu; mỗi lá cần hình ảnh và nhịp riêng.
10. Không lặp một memorable_message hay headline giữa hai mục bất kỳ trong chunk này.

## Ranh giới an toàn

${SAFETY_PREAMBLE}

## PROMPT GỐC (VENTUS — Daily)

${DAILY_PROMPT_BODY}

## DANH SÁCH VIỆC (${chunk.cardIds.length * ORIENTATIONS.length * VARIANTS_PER_COMBO} mục)

${jobLines.join("\n")}

## Ghi kết quả

Ghi MỘT mảng JSON gồm đủ ${chunk.cardIds.length * ORIENTATIONS.length * VARIANTS_PER_COMBO} object vào file:
  scripts/daily-content/output/chunks/${chunk.chunkId}.json

Sau đó tự kiểm bằng:
  node scripts/daily-content/merge.mts --check scripts/daily-content/output/chunks/${chunk.chunkId}.json

Sửa tới khi báo "Lỗi: 0". Cảnh báo cần đọc và cân nhắc (không bắt buộc sửa hết).`);
