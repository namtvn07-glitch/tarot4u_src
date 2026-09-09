import { CreateAffiliateLinkForm } from "@/components/admin/CreateAffiliateLinkForm";
import { AffiliateRowActions } from "@/components/admin/AffiliateRowActions";
import * as S from "@/components/admin/styles";
import {
  formatNumber,
  formatVnd,
  getAffiliateStats,
} from "@/lib/admin-queries";
import { env } from "@/lib/env";

// Số liệu gộp, không chạm dữ liệu cá nhân => không ghi nhật ký.
// Cache nằm ở tầng dữ liệu (getAffiliateStats), không phải ở trang: trang đọc
// cookie xác thực nên luôn render động.

function percent(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminAffiliatePage() {
  const rows = await getAffiliateStats();

  return (
    <>
      <h1 className="mt-0 mb-2" style={S.heading1}>
        Affiliate
      </h1>
      <p className="mt-0 mb-5" style={S.textMuted}>
        Phễu chuyển đổi theo từng mã: click → đăng ký → dùng thật → trả phí.
      </p>

      <div className="mb-6">
        <CreateAffiliateLinkForm siteUrl={env.NEXT_PUBLIC_SITE_URL} />
      </div>

      {rows.length === 0 ? (
        <p style={S.textBody}>Chưa có link nào. Tạo link đầu tiên ở khung phía trên.</p>
      ) : (
        <>
          <div
            className="overflow-x-auto rounded-lg"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <table className="w-full border-collapse" style={{ minWidth: "980px" }}>
              <caption className="sr-only">
                Hiệu quả từng link affiliate
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Mã
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Trạng thái
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Click
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Người truy cập
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Đăng ký
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Dùng thật
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Trả phí
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Doanh thu
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Thời gian chốt
                  </th>
                  <th scope="col" className="p-3" style={S.tableHeaderCell}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.code}>
                    <th scope="row" className="p-3 font-semibold" style={S.tableCell}>
                      {row.code}
                      {row.label && (
                        <span className="block font-normal" style={S.textDim}>
                          {row.label}
                        </span>
                      )}
                    </th>
                    <td className="p-3" style={S.tableCell}>
                      {/* Trạng thái có CHỮ, không chỉ dựa vào màu. */}
                      <span
                        style={row.is_active ? S.successText : S.textDim}
                      >
                        {row.is_active ? "Đang bật" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatNumber(row.clicks)}
                      {row.bot_clicks > 0 && (
                        <span className="block" style={S.textDim}>
                          +{formatNumber(row.bot_clicks)} lượt máy
                        </span>
                      )}
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatNumber(row.unique_visitors)}
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatNumber(row.signups)}
                      <span className="block" style={S.textDim}>
                        {percent(row.signups, row.clicks)} số click
                      </span>
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatNumber(row.activated_hard)}
                      <span className="block" style={S.textDim}>
                        {formatNumber(row.activated_soft)} có đọc bài
                      </span>
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatNumber(row.paying)}
                      <span className="block" style={S.textDim}>
                        {percent(row.paying, row.signups)} số đăng ký
                      </span>
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {formatVnd(row.revenue_vnd)}
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      {row.avg_hours_to_signup === null
                        ? "—"
                        : `${row.avg_hours_to_signup} giờ`}
                    </td>
                    <td className="p-3" style={S.tableCell}>
                      <AffiliateRowActions
                        code={row.code}
                        isActive={row.is_active}
                        siteUrl={env.NEXT_PUBLIC_SITE_URL}
                        hasSignups={row.signups > 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg p-5" style={S.surfaceSunken}>
            <h2 className="mt-0 mb-2" style={S.heading3}>
              Đọc bảng này thế nào
            </h2>
            <ul className="m-0 pl-5" style={S.textMuted}>
              <li>
                <strong>Dùng thật</strong> đếm người đã bỏ credit ra đọc một lượt
                sâu — con số chắc chắn, không thay đổi được. Dòng nhỏ bên dưới
                tính cả lượt đọc miễn phí, và sẽ giảm nếu người dùng tự xoá lịch
                sử đọc của họ.
              </li>
              <li>
                <strong>Click</strong> đã trừ lượt máy tự truy cập khi ai đó chia
                sẻ link lên Facebook, Zalo hay TikTok. Số lượt máy để riêng một
                dòng nhỏ.
              </li>
              <li>
                <strong>Đăng ký</strong> là con số tối thiểu, thực tế có thể cao
                hơn: người bấm link trong ứng dụng rồi mở lại bằng trình duyệt
                khác sẽ không ghi nhận được nguồn.
              </li>
              <li>
                <strong>Tắt một link</strong> chỉ ngừng đếm lượt bấm mới. Link
                vẫn mở được bình thường, số liệu cũ giữ nguyên, và ai đã bấm
                lúc link còn bật thì đăng ký muộn vẫn được tính đúng nguồn
                trong 30 ngày.
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
}
