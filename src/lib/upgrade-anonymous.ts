"use client";

import { createClient } from "@/lib/supabase/client";

export type UpgradeResult =
  | { status: "done"; email: string }
  | { status: "confirm-email"; email: string }
  | { status: "error"; message: string };

/**
 * Biến phiên ẩn danh hiện tại thành tài khoản thật, GIỮ NGUYÊN uuid.
 *
 * Đây là nguồn duy nhất của thao tác đó. Nó tồn tại vì cùng một sai lầm có thể
 * xảy ra ở hai chỗ: bất kỳ lời gọi `supabase.auth.signUp()` nào phát ra từ
 * trong một phiên ẩn danh đều tạo một hàng `auth.users` THỨ HAI và bỏ rơi hàng
 * cũ — cùng với credits đã trả tiền, các luận giải đã mua và mọi `readings`
 * gắn với uuid cũ. Người dùng không thấy lỗi nào cả; tiền của họ chỉ đơn giản
 * là biến mất vào một tài khoản không ai đăng nhập lại được nữa.
 *
 * `updateUser()` gắn email + mật khẩu vào chính hàng đang có, nên không có gì
 * phải di trú.
 */
export async function upgradeAnonymousToAccount(
  email: string,
  password: string,
): Promise<UpgradeResult> {
  const supabase = createClient();
  const trimmedEmail = email.trim();

  const { data, error } = await supabase.auth.updateUser({
    email: trimmedEmail,
    password,
  });

  if (error) return { status: "error", message: error.message };

  // Gắn nguồn affiliate ĐÚNG MỘT LẦN, ở đây — không phải lúc đăng nhập ẩn danh.
  // Gắn ở cả hai chỗ thì một người bị tính công hai lần và tỉ lệ chuyển đổi của
  // affiliate vượt quá 100%, kéo theo nghĩa vụ chi hoa hồng sai.
  //
  // Hỏng ở bước này không được làm hỏng việc nâng cấp: người dùng đã có tài
  // khoản rồi, mất một dòng attribution chỉ là chuyện của báo cáo nội bộ.
  void fetch("/api/account/claim-affiliate", { method: "POST" }).catch(() => {});

  // Khi project bật xác nhận email, địa chỉ mới nằm ở `new_email` cho tới lúc
  // người dùng bấm link — phiên vẫn là ẩn danh tới lúc đó, nên đừng báo "xong".
  if (!data.user?.email || data.user?.new_email) {
    return { status: "confirm-email", email: trimmedEmail };
  }

  return { status: "done", email: trimmedEmail };
}
