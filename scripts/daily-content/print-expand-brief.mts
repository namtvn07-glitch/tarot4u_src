// In "bản giao việc" MỞ RỘNG một chunk Daily đã có (v1, 250–350 từ) thành v2 (550–700 từ,
// thêm `card_meaning`). Giữ nguyên các phần đã duyệt: headline, memorable_message, điểm, keywords.
//   node scripts/daily-content/print-expand-brief.mts <số thứ tự chunk> [cardsPerChunk=3]
import { readFileSync } from "node:fs";
import { SAFETY_PREAMBLE } from "../../src/lib/ai/prompts/safety.ts";
import { DAILY_PROMPT_BODY } from "./prompt-body.ts";
import { buildChunks, cardById, keywordsFor } from "./combos.mts";

const args = process.argv.slice(2);
const cardsPerChunk = Number(args[1]) || 3;
const chunks = buildChunks(cardsPerChunk);
const chunk = chunks[Number(args[0]) - 1];
if (!chunk) throw new Error(`Chunk ${args[0]} không tồn tại (có ${chunks.length} chunk)`);

const v1Path = new URL(`./output/chunks/${chunk.chunkId}.json`, import.meta.url);
const v1: Record<string, unknown>[] = JSON.parse(readFileSync(v1Path, "utf8"));
const total = v1.length;

const cardInfo = chunk.cardIds
  .map((id) => {
    const c = cardById(id);
    return `- ${c.id}: ${c.name_vi} (${c.name_en}), số ${c.number}, ${c.arcana === "major" ? "Major" : `Minor ${c.suit}`}\n    upright: ${keywordsFor(c, "upright").join(", ")}\n    reversed: ${keywordsFor(c, "reversed").join(", ")}`;
  })
  .join("\n");

console.log(`# Nhiệm vụ: MỞ RỘNG nội dung Daily — ${chunk.chunkId}

Người dùng phản hồi: nội dung mỗi lá quá ngắn và không giải nghĩa lá bài. Bạn mở rộng ${total} bản v1 (bên dưới) thành v2,
đóng vai VENTUS theo PROMPT bên dưới (đã cập nhật độ dài). Đây KHÔNG phải viết lại từ đầu.

## Giữ NGUYÊN (copy y hệt từ v1)
card_id, orientation, variant, card, daily_scores, headline, memorable_message, keywords, và summary
(trừ khi summary > 25 từ thì rút gọn còn ≤ 25 từ).

## Viết mới / mở rộng
1. "card_meaning" (MỚI, bắt buộc): 4–6 câu, 90–120 từ — hình ảnh/biểu tượng của lá, ý nghĩa cốt lõi, sắc thái của
   đúng chiều Upright/Reversed này, vì sao đáng chú ý hôm nay. Viết cho người chưa biết Tarot. Không lặp summary/headline.
2. "love", "career", "finance": mỗi đoạn 3–5 câu, 60–90 từ. Giữ ý chính của v1 nhưng thêm bối cảnh cụ thể, tình huống
   đời thường (độc thân / đang tìm hiểu / đang yêu; đi làm / sinh viên; chi tiêu), và một gợi ý quan sát được.
3. "insight": 3–5 câu, 60–90 từ — đào sâu hơn ý của v1, vẫn là khả năng chứ không khẳng định về tâm lý user.
4. "advice": 3–5 câu, 50–80 từ — gồm một việc cụ thể làm được trong hôm nay (làm gì, vào lúc nào, làm thế nào).
5. "forecast": ĐÚNG 3 mục, mỗi mục 1–2 câu. Giữ các ý v1 (mở rộng) và thêm mục thứ ba nếu v1 chỉ có 2.
6. Tổng toàn bài 550–700 từ. Mỗi đoạn tối đa 5 câu. Không lặp ý giữa các đoạn.

## Quy tắc chung
- Mỗi việc → đúng 1 object JSON cùng các trường như v1 CỘNG "card_meaning". Chữ thuần: không markdown, không ký tự * # _ \` [ ] .
- Không nhắc ngày/thứ/tháng cụ thể. Không dùng "chắc chắn" (trừ phủ định), "định mệnh", "số phận", "tiên tri".
- Không dùng các cụm sáo rỗng: "chữa lành", "buông bỏ", "yêu thương bản thân", "tin vào vũ trụ".
- Ba biến thể của cùng một (lá, chiều) phải KHÁC NHAU thật sự: khác góc nhìn, khác ví dụ — đặc biệt ở "card_meaning":
  mỗi biến thể nhấn vào một khía cạnh khác của lá (không chép ba lần cùng một đoạn giải nghĩa).
- Chiều ngược là một góc đọc riêng (bóng của lá, năng lượng bị chặn/hướng vào trong), không mặc định là xấu.
- Giữ giọng của v1 (ấm, gần gũi, hơi đanh khi cần); mở rộng bằng chi tiết cụ thể chứ không độn chữ.
- Không khẳng định tuyệt đối về tâm lý user; không khuyến nghị đầu tư/giao dịch tài chính.

## Thông tin các lá trong chunk
${cardInfo}

## Ranh giới an toàn

${SAFETY_PREAMBLE}

## PROMPT GỐC (VENTUS — Daily, bản đã cập nhật)

${DAILY_PROMPT_BODY}

## BẢN v1 CẦN MỞ RỘNG (${total} mục)

${JSON.stringify(v1, null, 1)}

## Ghi kết quả

Ghi MỘT mảng JSON gồm đủ ${total} object v2 vào file:
  scripts/daily-content/output/chunks-v2/${chunk.chunkId}.json
(ghi theo từng lá nếu cần, nhưng file cuối phải là một mảng JSON hợp lệ đủ ${total} mục)

Sau đó tự kiểm bằng:
  node scripts/daily-content/merge.mts --check scripts/daily-content/output/chunks-v2/${chunk.chunkId}.json

Sửa tới khi báo "Lỗi: 0". Đọc và cân nhắc các cảnh báo. Báo lại: số mục, số lỗi, số cảnh báo, tổng từ trung bình mỗi mục.`);
