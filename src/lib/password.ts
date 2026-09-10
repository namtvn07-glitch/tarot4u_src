import { z } from "zod";

// Nguồn sự thật DUY NHẤT cho "mật khẩu thế nào là hợp lệ" — dùng chung cho đăng ký,
// đổi mật khẩu và đặt lại mật khẩu, ở cả client (phản hồi lúc gõ) lẫn server (phán
// quyết thật).
//
// Không kiểm mật khẩu phổ biến / dữ liệu rò rỉ công khai (HaveIBeenPwned) — bỏ theo
// yêu cầu 2026-09-09, không cần thiết cho quy mô sản phẩm hiện tại.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RECOMMENDED_LENGTH = 15;
// bcrypt (thuật toán GoTrue dùng) cắt sau 72 byte — cho nhập dài hơn nghĩa là âm
// thầm bỏ phần đuôi mà người dùng tưởng mình đang được bảo vệ.
export const PASSWORD_MAX_BYTES = 72;

export type PasswordRuleId = "length" | "maxLength" | "context" | "sequence";

export interface PasswordContext {
  /** Email của chính tài khoản — dùng để chặn mật khẩu chứa tên tài khoản. */
  email?: string | null;
}

export interface PasswordEvaluation {
  failures: PasswordRuleId[];
  isValid: boolean;
  /** Đạt hết luật VÀ dài từ mức khuyến nghị trở lên. */
  isStrong: boolean;
}

// Câu mô tả YÊU CẦU (dùng cho checklist trong form — luôn ở thể khẳng định).
export const PASSWORD_RULE_LABELS: Record<PasswordRuleId, string> = {
  length: `Ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
  maxLength: "Không quá 72 byte (khoảng 72 ký tự thường)",
  context: "Không chứa email hoặc tên trang web của bạn",
  sequence: "Không phải chuỗi lặp hoặc dãy liên tiếp (aaaa…, 12345…)",
};

// Câu báo LỖI (dùng khi server trả về, đứng một mình được).
export const PASSWORD_RULE_ERRORS: Record<PasswordRuleId, string> = {
  length: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
  maxLength: "Mật khẩu quá dài — tối đa 72 byte.",
  context: "Mật khẩu không được chứa email hoặc tên trang web của bạn.",
  sequence: "Mật khẩu không được là chuỗi lặp hoặc dãy ký tự liên tiếp.",
};

// Chặn mật khẩu "nói về chính chỗ này". Giữ luôn "ventus" — brand cũ vẫn còn
// trong đầu người dùng lâu năm và vẫn là chuỗi dễ đoán, đổi thương hiệu không
// làm nó an toàn hơn.
const BRAND_TERMS = [
  "tarot",
  "ventus",
  "xembaitarot",
  "xembai",
  "boitarot",
  "boibai",
  "vantay",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Đếm theo code point — "🔮".length là 2 trong JS, nhưng người dùng gõ 1 ký tự. */
function codePointLength(value: string): number {
  return [...value].length;
}

/**
 * Toàn bộ chuỗi là một ký tự lặp lại, hoặc một dãy liên tiếp tăng/giảm đều
 * ("abcdefgh", "87654321"). Chỉ bắt trường hợp TOÀN chuỗi — "abc" nằm giữa một mật
 * khẩu dài ngẫu nhiên là bình thường, chặn nó chỉ làm phiền người dùng.
 */
function isRepeatOrSequence(value: string): boolean {
  const chars = [...value];
  if (chars.length < 3) return false;

  const allSame = chars.every((char) => char === chars[0]);
  if (allSame) return true;

  const step = chars[1].codePointAt(0)! - chars[0].codePointAt(0)!;
  if (step !== 1 && step !== -1) return false;
  return chars.every(
    (char, index) =>
      index === 0 || char.codePointAt(0)! - chars[index - 1].codePointAt(0)! === step,
  );
}

export function evaluatePassword(
  password: string,
  context: PasswordContext = {},
): PasswordEvaluation {
  const failures: PasswordRuleId[] = [];
  const normalized = normalize(password);

  if (codePointLength(password) < PASSWORD_MIN_LENGTH) failures.push("length");
  if (byteLength(password) > PASSWORD_MAX_BYTES) failures.push("maxLength");

  const emailLocalPart = context.email ? normalize(context.email).split("@")[0] : "";
  const contextTerms = [
    ...BRAND_TERMS,
    // Dưới 3 ký tự thì "chứa" gần như luôn đúng — thành ra chặn bừa.
    ...(emailLocalPart.length >= 3 ? [emailLocalPart] : []),
  ];
  if (normalized.length > 0 && contextTerms.some((term) => normalized.includes(term))) {
    failures.push("context");
  }

  if (isRepeatOrSequence(password)) failures.push("sequence");

  return {
    failures,
    isValid: failures.length === 0,
    isStrong:
      failures.length === 0 && codePointLength(password) >= PASSWORD_RECOMMENDED_LENGTH,
  };
}

/** Zod schema dùng ở API route — cùng luật, cùng câu chữ với UI. */
export function createPasswordSchema(context: PasswordContext = {}) {
  return z.string().superRefine((value, ctx) => {
    for (const failure of evaluatePassword(value, context).failures) {
      ctx.addIssue({ code: "custom", message: PASSWORD_RULE_ERRORS[failure] });
    }
  });
}
