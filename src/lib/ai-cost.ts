// Bảng giá token để quy ra chi phí AI ước tính trên dashboard.
//
// Nguồn: trang giá chính thức Gemini API — https://ai.google.dev/gemini-api/docs/pricing
// Tra ngày 2026-09-09. Đơn vị: USD cho 1 TRIỆU token, bậc trả phí (paid tier).
//
// LƯU Ý QUAN TRỌNG: giá hiện tại của dòng 3.x Flash là GIÁ KHUYẾN MÃI, hết hạn
// 31/12/2026 và tăng GẤP ĐÔI từ 01/01/2027. Vì vậy bảng này lưu theo bậc thời
// gian thay vì một con số chết — nếu hardcode 0.75 thì từ tháng 1/2027 dashboard
// sẽ âm thầm báo chi phí chỉ bằng một nửa thực tế, mà con số đó lại dùng để
// đánh giá biên lợi nhuận.
//
// Model chưa có trong bảng sẽ hiện rõ "chưa cấu hình giá" chứ không âm thầm
// tính thành 0đ — số bịa còn tệ hơn không có số.

export interface PriceTier {
  // Bậc giá áp dụng cho tới TRƯỚC mốc này (ISO date). Bậc cuối không có mốc.
  untilIso?: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

// Khoá là giá trị ghi trong readings.model.
export const MODEL_PRICES: Record<string, PriceTier[]> = {
  // 3.8 / 3.7 / 3.6 Flash dùng chung một biểu giá (xác nhận trên trang chính thức).
  "gemini-3.8-flash": [
    { untilIso: "2027-01-01", inputUsdPerMillion: 0.75, outputUsdPerMillion: 3.75 },
    { inputUsdPerMillion: 1.5, outputUsdPerMillion: 7.5 },
  ],
  "gemini-3.7-flash": [
    { untilIso: "2027-01-01", inputUsdPerMillion: 0.75, outputUsdPerMillion: 3.75 },
    { inputUsdPerMillion: 1.5, outputUsdPerMillion: 7.5 },
  ],
  "gemini-3.6-flash": [
    { untilIso: "2027-01-01", inputUsdPerMillion: 0.75, outputUsdPerMillion: 3.75 },
    { inputUsdPerMillion: 1.5, outputUsdPerMillion: 7.5 },
  ],
  "gemini-3.5-flash": [
    { inputUsdPerMillion: 1.5, outputUsdPerMillion: 9.0 },
  ],
};

export const PRICES_UPDATED_AT = "2026-09-09";

// Tỉ giá quy đổi. Dùng giá NGÂN HÀNG BÁN RA (~26.170đ ngày 09/09/2026, Vietcombank)
// chứ không phải tỉ giá trung tâm (25.594đ): mua USD trả cho Google thì phải trả
// theo giá bán, nên đây là con số sát chi phí thật hơn.
export const USD_TO_VND = 26_170;

export interface TokenUsage {
  input: number;
  output: number;
}

export interface AiCostBreakdown {
  model: string;
  input: number;
  output: number;
  costVnd: number | null; // null = chưa cấu hình giá cho model này
}

function resolvePrice(model: string, at: Date): PriceTier | null {
  const tiers = MODEL_PRICES[model];
  if (!tiers) return null;
  return (
    tiers.find((tier) => tier.untilIso && at < new Date(tier.untilIso)) ??
    tiers.find((tier) => !tier.untilIso) ??
    null
  );
}

export function computeAiCost(
  tokensByModel: Record<string, TokenUsage>,
  at: Date = new Date(),
): { rows: AiCostBreakdown[]; totalVnd: number; hasUnpriced: boolean } {
  const rows: AiCostBreakdown[] = Object.entries(tokensByModel).map(
    ([model, usage]) => {
      const price = resolvePrice(model, at);
      const costVnd = price
        ? Math.round(
            ((usage.input / 1_000_000) * price.inputUsdPerMillion +
              (usage.output / 1_000_000) * price.outputUsdPerMillion) *
              USD_TO_VND,
          )
        : null;
      return { model, input: usage.input, output: usage.output, costVnd };
    },
  );

  return {
    rows: rows.sort((a, b) => b.input + b.output - (a.input + a.output)),
    totalVnd: rows.reduce((sum, row) => sum + (row.costVnd ?? 0), 0),
    hasUnpriced: rows.some((row) => row.costVnd === null),
  };
}
