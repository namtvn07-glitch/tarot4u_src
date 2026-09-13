import { decodeDrawToken } from "@/lib/draw-token-client";
import { DEEP_SESSION_STORAGE_KEY, READINGS_STORAGE_KEY } from "@/lib/storage-keys";
import type { ReadingHistoryItem } from "@/types/tarot";

// Chủ sở hữu của dữ liệu đang nằm trong trình duyệt.
//
// `null` = phiên ẩn danh (chưa đăng nhập). Với phiên trải bài sâu đây là một
// trạng thái HỢP LỆ, không phải "thiếu dữ liệu": /api/reading/deep/shuffle ký
// token với `userId: null` khi người dùng chưa đăng nhập, và
// /api/reading/deep/personal cố ý cho BẤT KỲ tài khoản nào đăng nhập sau đó
// "nhận" token ẩn danh ấy. Vì vậy phiên ẩn danh phải sống sót qua bước đăng
// nhập, trong khi phiên của một tài khoản cụ thể thì không bao giờ được sang
// tay tài khoản khác.
export type StorageOwnerId = string | null;

interface StoredReadingsCache {
  ownerId: string;
  items: ReadingHistoryItem[];
}

function parseStored(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Dữ liệu hỏng/không phải JSON (người dùng tự sửa, bản build cũ) — coi như
    // không có. Không ném lỗi vì mọi nơi gọi đều chỉ dùng nó làm bộ đệm phụ.
    return null;
  }
}

/**
 * Phiên trải bài sâu trong sessionStorage có được phép hiện ra cho danh tính
 * hiện tại hay không.
 *
 * Chủ sở hữu đọc thẳng từ `drawToken` của chính phiên đó chứ không từ một
 * trường tự khai kèm bên cạnh: token là thứ duy nhất server thật sự chấp
 * nhận, nên lấy nó làm mốc thì quy tắc ở đây luôn khớp quy tắc ở
 * personal/route.ts (token ẩn danh ai cũng nhận được, token đã gắn userId thì
 * chỉ chính chủ) — và không có kẽ hở nào để một trường tự khai bị ghi sai
 * trong lúc danh tính đang đổi.
 *
 * Phiên không giải mã được token thì bị coi là không phải của người đang đăng
 * nhập: một phiên không dùng được nữa, giữ lại chẳng để làm gì.
 */
export function isDeepSessionOwnedBy(session: unknown, currentUserId: StorageOwnerId): boolean {
  if (!session || typeof session !== "object") return false;
  const payload = decodeDrawToken((session as { drawToken?: unknown }).drawToken);
  if (!payload) return false;
  if (payload.userId === null) return true;
  return payload.userId === currentUserId;
}

/**
 * Đọc bộ đệm lịch sử trải bài trong localStorage của đúng người đang đăng nhập.
 *
 * Bộ đệm này chỉ là bản sao dự phòng cho khoảng trễ giữa lúc lưu và lúc bảng
 * `readings` trả về dữ liệu — nguồn thật luôn là Supabase. Vì vậy khi không
 * chứng minh được chủ sở hữu (mảng trần do bản build cũ ghi, hoặc chưa đăng
 * nhập) thì trả về rỗng: mất một bản sao là chấp nhận được, hiện quẻ của
 * người khác thì không.
 */
export function readLocalReadings(currentUserId: StorageOwnerId): ReadingHistoryItem[] {
  if (typeof window === "undefined" || !currentUserId) return [];
  const parsed = parseStored(localStorage.getItem(READINGS_STORAGE_KEY));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const cache = parsed as Partial<StoredReadingsCache>;
  if (cache.ownerId !== currentUserId || !Array.isArray(cache.items)) return [];
  return cache.items;
}

export function saveLocalReading(
  reading: ReadingHistoryItem,
  currentUserId: StorageOwnerId,
): void {
  if (typeof window === "undefined" || !currentUserId) return;
  const cache: StoredReadingsCache = {
    ownerId: currentUserId,
    items: [reading, ...readLocalReadings(currentUserId)],
  };
  try {
    localStorage.setItem(READINGS_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Hết quota hoặc trình duyệt chặn ghi — bản ghi thật đã nằm ở bảng
    // `readings` phía server rồi, mất bộ đệm phụ không đáng để chặn luồng.
  }
}

/**
 * Xoá mọi dữ liệu trong trình duyệt không thuộc về danh tính hiện tại.
 *
 * Gọi mỗi lần biết được danh tính (tải trang, đăng nhập, đăng xuất). Phép này
 * idempotent và chỉ đụng vào những gì không phải của người đang đăng nhập.
 */
export function purgeForeignUserStorage(currentUserId: StorageOwnerId): void {
  if (typeof window === "undefined") return;

  try {
    const rawSession = sessionStorage.getItem(DEEP_SESSION_STORAGE_KEY);
    if (rawSession && !isDeepSessionOwnedBy(parseStored(rawSession), currentUserId)) {
      sessionStorage.removeItem(DEEP_SESSION_STORAGE_KEY);
    }
  } catch {
    // sessionStorage bị chặn (chế độ riêng tư, cấu hình trình duyệt) — không
    // có gì để dọn thì cũng không có gì rò rỉ.
  }

  try {
    if (localStorage.getItem(READINGS_STORAGE_KEY) && readLocalReadings(currentUserId).length === 0) {
      localStorage.removeItem(READINGS_STORAGE_KEY);
    }
  } catch {
    // Cùng lý do với sessionStorage ở trên.
  }
}
