import type { ThreeCardAiOutput, ThreeCardResult } from "@/lib/ai/schemas/three-card";
import { positionLabel } from "@/lib/spreads";
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
    // Không có pattern thì không có gì để diễn giải — bỏ phần model tự bịa ra.
    pattern_note:
      context.dominantSuit === "none" && context.repeatedNumber === null
        ? ""
        : ai.pattern_note.trim(),
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

// Bản chữ thuần của kết quả: nội dung nút Chia sẻ/Sao chép và `personal_body` dự phòng.
// Chữ thường, không markdown — dán vào tin nhắn/ghi chú vẫn đọc được.
export function threeCardResultToText(result: ThreeCardResult): string {
  const lines: string[] = [
    "KẾT LUẬN",
    result.verdict,
    result.summary,
    "",
    "BỨC TRANH LỚN",
    `${result.major_count} Ẩn Chính · ${result.minor_count} Ẩn Phụ${
      suitLabel(result.dominant_suit) ? ` · Bộ ${suitLabel(result.dominant_suit)} chủ đạo` : ""
    }`,
    result.overall_story,
    ...(result.pattern_note ? [result.pattern_note] : []),
    "",
    "BA LÁ ĐANG NÓI GÌ",
    ...result.cards.flatMap((card, index) => [
      `${index + 1}. ${positionLabel("three_card", index)} — ${card.card}`,
      card.summary,
      card.interpretation,
      "",
    ]),
    "ĐIỀU BẠN CÓ THỂ CHƯA NHÌN THẤY",
    result.hidden_insight,
    "",
    "XU HƯỚNG PHÍA TRƯỚC",
    ...result.forecast.map((item) => `- ${item}`),
    "",
    "LỜI NHẮN",
    result.advice,
    "",
    result.memorable_message,
    ...(result.keywords.length > 0 ? ["", result.keywords.map((k) => `#${k.replace(/\s+/g, "")}`).join(" ")] : []),
  ];
  return lines.join("\n").normalize("NFC");
}
