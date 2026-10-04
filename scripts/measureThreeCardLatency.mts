// Đo độ trễ THẬT của luận giải 3 lá (Phase 0 của kế hoạch): chạy đúng đường mà
// /api/reading/deep/personal chạy — buildReadingContext → buildThreeCardPrompt →
// getAiProvider().generateJson → finalizeThreeCardResult — rồi in trung vị / p95.
//
//   npx tsx --env-file=.env.local scripts/measureThreeCardLatency.mts [số lượt = 6]
//   npx tsx --env-file=.env.local scripts/measureThreeCardLatency.mts --dry
//
// --dry: chỉ dựng prompt và in kích thước, KHÔNG gọi AI (không tốn tiền, không cần key).
// Mỗi lượt gọi AI thật — chạy với provider/model đang dùng ở production để số đo có nghĩa.
// Quyết định từ kết quả: trung vị ≤ ~15s thì giữ "chờ rồi hiện dần"; ≥ ~25–30s thì cân
// nhắc stream từng khối (xem implementation-plan.md, mục Phase 0).
import { getAiProvider } from "../src/lib/ai/provider";
import { buildThreeCardPrompt } from "../src/lib/ai/prompts/three-card";
import { ThreeCardAiOutputSchema } from "../src/lib/ai/schemas/three-card";
import { finalizeThreeCardResult } from "../src/lib/ai/three-card-result";
import { drawCards } from "../src/lib/reading";
import { buildReadingContext } from "../src/lib/reading-context";

const QUESTIONS: { topic: string; question: string }[] = [
  { topic: "love", question: "Cô ấy có thích tôi không?" },
  { topic: "career", question: "Tôi có nên nghỉ việc để theo đuổi dự án riêng không?" },
  { topic: "love", question: "Người yêu cũ có khả năng quay lại không?" },
  { topic: "finance", question: "Áp lực tiền bạc của tôi trong vài tháng tới sẽ ra sao?" },
  { topic: "general", question: "Giai đoạn này tôi cần chú ý điều gì nhất?" },
  { topic: "spiritual", question: "Tại sao tôi cứ lặp lại một kiểu quan hệ cũ?" },
];

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const runs = Number(args.find((a) => /^\d+$/.test(a))) || QUESTIONS.length;

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

const durations: number[] = [];
let failures = 0;

for (let i = 0; i < (dry ? 1 : runs); i++) {
  const { topic, question } = QUESTIONS[i % QUESTIONS.length];
  const context = buildReadingContext({
    spreadId: "three_card",
    topic,
    question,
    draws: drawCards(3, "independent"),
  });
  const prompt = buildThreeCardPrompt(context);

  if (dry) {
    console.log(`system: ${prompt.system.length} ký tự | userTurn: ${prompt.userTurn.length} ký tự | maxTokens: ${prompt.maxTokens}`);
    console.log("--- userTurn ---\n" + prompt.userTurn);
    break;
  }

  const startedAt = Date.now();
  try {
    const out = await getAiProvider().generateJson({
      system: prompt.system,
      userTurn: prompt.userTurn,
      schemaName: "three_card_reading",
      schema: ThreeCardAiOutputSchema,
      maxTokens: prompt.maxTokens,
    });
    const result = finalizeThreeCardResult(out.data, context);
    const ms = Date.now() - startedAt;
    durations.push(ms);
    console.log(
      `#${i + 1} ${ms}ms | ${out.model} | stop=${out.stopReason} | in=${out.usage.inputTokens} out=${out.usage.outputTokens} | cards=${result.cards.length} | "${question}"`,
    );
  } catch (error) {
    failures++;
    console.log(`#${i + 1} LỖI sau ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!dry && durations.length > 0) {
  const sorted = [...durations].sort((a, b) => a - b);
  console.log(
    `\n${durations.length}/${runs} thành công, ${failures} lỗi | trung vị ${percentile(sorted, 50)}ms | p95 ${percentile(sorted, 95)}ms | lớn nhất ${sorted[sorted.length - 1]}ms`,
  );
}
