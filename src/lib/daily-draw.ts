// Chọn lá + biến thể cho Daily. Hàm thuần (không import gì) để kiểm bằng script
// thường mà không cần dựng server.

/**
 * Rút như một bộ bài thật: mỗi người có bộ 78 lá riêng, rút không hoàn lại cho
 * tới khi hết rồi xáo lại. Nhờ vậy người quay lại mỗi ngày không gặp lại cùng
 * một lá (và cùng một đoạn chữ) trước khi đi hết bộ.
 *
 * "Chu kỳ hiện tại" = đoạn đầu dài nhất của lịch sử (mới nhất trước) gồm toàn lá
 * khác nhau; gặp lá lặp là biên của chu kỳ trước.
 */
export function pickCard(
  availableIds: readonly string[],
  recentIdsNewestFirst: readonly string[],
  randomIndex: (bound: number) => number,
): string {
  if (availableIds.length === 0) throw new Error("daily_no_cards_available");

  const drawnInCycle = new Set<string>();
  for (const id of recentIdsNewestFirst) {
    if (drawnInCycle.has(id)) break;
    drawnInCycle.add(id);
  }

  const remaining = availableIds.filter((id) => !drawnInCycle.has(id));
  if (remaining.length > 0) return remaining[randomIndex(remaining.length)];

  // Bộ bài đã đi hết → xáo lại. Xáo trơn thì lá vừa rút hôm qua có thể ra lại
  // ngay hôm nay (đúng một lá trong 78 khả năng, nhưng người dùng nhớ rất rõ
  // chuyện đó), nên loại 1/4 số lá mới rút nhất khỏi lượt đầu của chu kỳ mới.
  const justDrawn = new Set(recentIdsNewestFirst.slice(0, Math.floor(availableIds.length / 4)));
  const reshuffled = availableIds.filter((id) => !justDrawn.has(id));
  const pool = reshuffled.length > 0 ? reshuffled : availableIds;
  return pool[randomIndex(pool.length)];
}

/**
 * Ưu tiên biến thể người này chưa xem cho đúng (lá, chiều) này. Nếu đã xem hết,
 * chọn biến thể được xem LÂU NHẤT trước đây — gần nhất với "chưa từng xem".
 */
export function pickVariant(
  approvedVariants: readonly number[],
  usedVariantsNewestFirst: readonly number[],
  randomIndex: (bound: number) => number,
): number {
  if (approvedVariants.length === 0) throw new Error("daily_no_variants_available");

  const unused = approvedVariants.filter((v) => !usedVariantsNewestFirst.includes(v));
  if (unused.length > 0) return unused[randomIndex(unused.length)];

  // Vị trí lớn nhất trong danh sách "mới nhất trước" = xem lâu nhất.
  let oldest = approvedVariants[0];
  let oldestPosition = -1;
  for (const variant of approvedVariants) {
    const position = usedVariantsNewestFirst.indexOf(variant);
    if (position > oldestPosition) {
      oldestPosition = position;
      oldest = variant;
    }
  }
  return oldest;
}
