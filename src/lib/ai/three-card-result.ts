import type { ThreeCardAiOutput, ThreeCardResult } from "@/lib/ai/schemas/three-card";
import { SUIT_LABEL_VI, type ReadingContext } from "@/lib/reading-context";

// Chuẩn hoá JSON model trả về thành bản lưu. Những gì server BIẾT CHẮC thì ghi
// đè giá trị của model: số Major/Minor, suit chủ đạo (model đếm sai khá thường
// xuyên), thứ tự/khoá vị trí và tên lá.
//
// Ném "ai_json_parse_failed" khi số lá trả về không đúng — withAiRetry coi đó là
// lỗi tạm thời và sinh lại, còn hơn hiển thị một bài thiếu lá.
export function finalizeThreeCardResult(
  ai: ThreeCardAiOutput,
  context: ReadingContext,
): ThreeCardResult {
  if (ai.cards.length !== context.cards.length) {
    throw new Error("ai_json_parse_failed");
  }

  return {
    ...ai,
    version: 1,
    spread: "three_card",
    major_count: context.majorCount,
    minor_count: context.minorCount,
    dominant_suit: context.dominantSuit,
    cards: ai.cards.map((entry, index) => ({
      ...entry,
      position: context.cards[index].position.key,
      card: context.cards[index].card.name_vi,
    })),
  };
}

export function suitLabel(value: string): string {
  return value in SUIT_LABEL_VI ? SUIT_LABEL_VI[value as keyof typeof SUIT_LABEL_VI] : "";
}

// Bản chữ thuần của kết quả: dùng làm `readings.personal_body` dự phòng và làm
// nội dung nút Chia sẻ. Giữ tiêu đề dạng "## " để những nơi còn hiển thị theo
// kiểu markdown cũ vẫn đọc được.
export function threeCardResultToText(result: ThreeCardResult): string {
  const lines: string[] = [
    "## Kết luận",
    result.verdict,
    result.summary,
    "",
    "## Bức tranh lớn",
    result.overall_story,
    "",
    "## Ba lá đang nói gì",
    ...result.cards.flatMap((card) => [`### ${card.card}`, card.summary, card.interpretation]),
    "",
    "## Điều bạn có thể chưa nhìn thấy",
    result.hidden_insight,
    "",
    "## Xu hướng phía trước",
    ...result.forecast.map((item) => `- ${item}`),
    "",
    "## Lời nhắn",
    result.advice,
    "",
    result.memorable_message,
  ];
  return lines.join("\n").normalize("NFC");
}
