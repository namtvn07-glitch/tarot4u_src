import { z } from "zod";

// Nguồn sự thật DUY NHẤT cho "mật khẩu thế nào là hợp lệ" — dùng chung cho đăng ký,
// đổi mật khẩu và đặt lại mật khẩu, ở cả client (phản hồi lúc gõ) lẫn server (phán
// quyết thật). Chỉ dùng Web Crypto/TextEncoder nên chạy được cả hai phía.
//
// Bám NIST SP 800-63B-4 (bản chính thức 8/2025) với MỘT sai lệch có chủ đích:
// chuẩn đòi tối thiểu 15 ký tự khi mật khẩu là cách xác thực duy nhất (8 chỉ đủ khi
// có MFA) — dự án chốt 8 để giảm ma sát đăng ký, và bù lại bằng phần blocklist bên
// dưới (mật khẩu đã lộ / phổ biến / theo ngữ cảnh / chuỗi tuần tự) vốn KHÔNG nới.
// Ngày nào có MFA thì con số 8 mới thật sự đúng chuẩn.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RECOMMENDED_LENGTH = 15;
// bcrypt (thuật toán GoTrue dùng) cắt sau 72 byte — cho nhập dài hơn nghĩa là âm
// thầm bỏ phần đuôi mà người dùng tưởng mình đang được bảo vệ.
export const PASSWORD_MAX_BYTES = 72;

export type PasswordRuleId = "length" | "maxLength" | "common" | "context" | "sequence";

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
  common: "Không phải mật khẩu phổ biến",
  context: "Không chứa email hoặc tên trang web của bạn",
  sequence: "Không phải chuỗi lặp hoặc dãy liên tiếp (aaaa…, 12345…)",
};

// Câu báo LỖI (dùng khi server trả về, đứng một mình được).
export const PASSWORD_RULE_ERRORS: Record<PasswordRuleId, string> = {
  length: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
  maxLength: "Mật khẩu quá dài — tối đa 72 byte.",
  common: "Mật khẩu này quá phổ biến, rất dễ bị đoán.",
  context: "Mật khẩu không được chứa email hoặc tên trang web của bạn.",
  sequence: "Mật khẩu không được là chuỗi lặp hoặc dãy ký tự liên tiếp.",
};

// Chặn nhanh phía trước HIBP: những mật khẩu này bị đoán trong vài giây đầu của bất
// kỳ cuộc tấn công nào. Cố ý gồm cả biến thể tiếng Việt không dấu — wordlist quốc tế
// thường bỏ sót chúng, mà người dùng Việt lại hay đặt.
const COMMON_PASSWORDS = new Set([
  "123456", "12345678", "123456789", "1234567890", "111111", "000000", "121212",
  "abc123", "abcd1234", "a1b2c3d4", "qwerty", "qwerty123", "qwertyuiop", "asdfghjkl",
  "zxcvbnm", "1q2w3e4r", "1qaz2wsx", "password", "password1", "password123",
  "passw0rd", "p@ssword", "p@ssw0rd", "letmein", "welcome", "welcome1", "admin",
  "admin123", "administrator", "root", "toor", "guest", "test", "test123",
  "iloveyou", "princess", "sunshine", "dragon", "monkey", "football", "baseball",
  "superman", "batman", "michael", "jennifer", "shadow", "master", "trustno1",
  "starwars", "computer", "internet", "samsung", "google", "facebook", "whatever",
  "matkhau", "matkhau123", "matkhau1234", "matkhau@123", "khongbiet", "khongco",
  "vietnam", "vietnam123", "hanoi", "hanoi123", "saigon", "saigon123", "haiphong",
  "danang", "cantho", "anhyeuem", "emyeuanh", "yeuemnhieu", "gaixinh", "chaobanmoi",
  "thanhcong", "mayman", "binhan", "hanhphuc", "toiyeuvietnam", "quenmatkhau",
  "dangnhap", "taikhoan", "nguyenvana", "nguyenvan", "buicongtu", "hocsinh",
  "sinhvien", "giaovien", "changtrai", "cogai", "bimat", "bimat123",
  "tarot", "tarot123", "boitarot", "ventus", "ventustarot", "boibai", "boibai123",
]);

// Chặn mật khẩu "nói về chính chỗ này" — NIST-4 yêu cầu blocklist gồm cả từ theo ngữ
// cảnh dịch vụ, không chỉ wordlist chung.
const BRAND_TERMS = ["tarot", "ventus", "boitarot", "boibai", "vantay"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * So khớp chính xác với danh sách là chưa đủ: `Matkhau123456` hay `password!!` vẫn
 * là chính những mật khẩu đó, chỉ dán thêm đuôi cho "đủ điều kiện". Nên ngoài chuỗi
 * gốc, ta còn thử phần lõi chữ cái (bỏ ký tự không phải chữ ở hai đầu) và bản dịch
 * ngược leetspeak (`p@ssw0rd` → `password`).
 */
function commonVariants(value: string): string[] {
  const base = normalize(value);
  const core = base.replace(/^[^a-z]+/, "").replace(/[^a-z]+$/, "");
  const deLeet = (input: string) =>
    input
      .replace(/[@4]/g, "a")
      .replace(/0/g, "o")
      .replace(/[1!|]/g, "i")
      .replace(/3/g, "e")
      .replace(/[$5]/g, "s")
      .replace(/7/g, "t");
  return [base, core, deLeet(base), deLeet(core)];
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
  if (commonVariants(password).some((variant) => COMMON_PASSWORDS.has(variant))) {
    failures.push("common");
  }

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

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Mật khẩu này đã xuất hiện trong dữ liệu bị rò rỉ chưa? (NIST-4 bắt buộc có bước
 * này.) Dùng k-anonymity của HaveIBeenPwned: chỉ 5 ký tự hex đầu của SHA-1 rời khỏi
 * máy, HIBP trả về hàng trăm hậu tố và ta tự so ở đây — bản thân mật khẩu không bao
 * giờ được gửi đi đâu cả.
 *
 * Trả `null` khi không kiểm tra được (mạng lỗi / quá 3 giây). Caller quyết định, và
 * quyết định của dự án này là CHO QUA + log Sentry: không chặn người dùng đăng ký vì
 * một API bên thứ ba đang sập.
 */
export async function isPasswordBreached(
  password: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<boolean | null> {
  const { signal, timeoutMs = 3000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Padding làm mọi phản hồi có kích thước tương đương — người quan sát đường
      // truyền không suy ra được prefix nào hiếm/phổ biến.
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const body = await response.text();
    for (const line of body.split("\n")) {
      const [lineSuffix, rawCount] = line.trim().split(":");
      if (lineSuffix !== suffix) continue;
      // Hàng độn do Add-Padding sinh ra luôn có count = 0 — phải so > 0, không được
      // coi "có mặt trong danh sách" là "đã bị lộ".
      return Number(rawCount ?? 0) > 0;
    }
    return false;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
