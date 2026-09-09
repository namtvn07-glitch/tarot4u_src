import { StatTile } from "@/components/admin/StatTile";
import { TrendChart } from "@/components/admin/TrendChart";
import * as S from "@/components/admin/styles";
import { computeAiCost, PRICES_UPDATED_AT, USD_TO_VND } from "@/lib/ai-cost";
import {
  formatNumber,
  formatVnd,
  getDailySeries,
  getOverviewStats,
} from "@/lib/admin-queries";

// KHÔNG đặt `export const revalidate` ở đây: trang đọc cookie để kiểm tra
// quyền admin nên Next luôn render động, dòng đó sẽ vô hiệu (kết quả build
// hiện `ƒ Dynamic`). Việc cache nằm ở tầng dữ liệu — xem getOverviewStats /
// getDailySeries trong src/lib/admin-queries.ts.

function shortDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export default async function AdminOverviewPage() {
  const [stats, series] = await Promise.all([
    getOverviewStats(),
    getDailySeries(30),
  ]);

  if (!stats) {
    return (
      <>
        <h1 style={S.heading1}>Tổng quan</h1>
        <p role="alert" style={{ ...S.textBody, ...S.dangerText }}>
          Chưa lấy được số liệu. Thử tải lại trang; nếu vẫn vậy thì báo kỹ thuật.
        </p>
      </>
    );
  }

  const cost = computeAiCost(stats.ai_tokens_by_model ?? {});
  const paidRate =
    stats.orders_created_30d > 0
      ? Math.round((stats.orders_paid_30d / stats.orders_created_30d) * 100)
      : null;

  return (
    <>
      <h1 className="mt-0 mb-5" style={S.heading1}>
        Tổng quan
      </h1>

      <section aria-labelledby="nguoi-dung" className="mb-6">
        <h2 id="nguoi-dung" className="mt-0 mb-3" style={S.heading3}>
          Người dùng
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Tổng người dùng" value={formatNumber(stats.total_users)} />
          <StatTile
            label="Mới trong 30 ngày"
            value={formatNumber(stats.new_users_30d)}
            hint={`${formatNumber(stats.new_users_7d)} trong 7 ngày`}
          />
          <StatTile
            label="Hoạt động hôm nay"
            value={formatNumber(stats.dau)}
            hint="có ít nhất 1 lượt đọc, giờ VN"
          />
          <StatTile
            label="Hoạt động 7 ngày"
            value={formatNumber(stats.wau)}
          />
        </div>
      </section>

      <section aria-labelledby="doanh-thu" className="mb-6">
        <h2 id="doanh-thu" className="mt-0 mb-3" style={S.heading3}>
          Doanh thu
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Tổng doanh thu"
            value={formatVnd(stats.total_revenue_vnd)}
            tone="accent"
          />
          <StatTile
            label="30 ngày"
            value={formatVnd(stats.revenue_30d_vnd)}
            hint={`${formatVnd(stats.revenue_7d_vnd)} trong 7 ngày`}
          />
          <StatTile
            label="Người đã trả phí"
            value={formatNumber(stats.paying_users)}
          />
          <StatTile
            label="Credits tồn đọng"
            value={formatNumber(stats.outstanding_credits)}
            hint="đã trả tiền, chưa dùng — là nợ dịch vụ"
            tone="warning"
          />
        </div>
      </section>

      <section aria-labelledby="phieu-thanh-toan" className="mb-6">
        <h2 id="phieu-thanh-toan" className="mt-0 mb-3" style={S.heading3}>
          Phễu thanh toán (đơn tạo trong 30 ngày)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Đơn đã tạo" value={formatNumber(stats.orders_created_30d)} />
          <StatTile
            label="Đã thanh toán"
            value={formatNumber(stats.orders_paid_30d)}
            hint={paidRate === null ? undefined : `${paidRate}% số đơn đã tạo`}
          />
          <StatTile
            label="Hết hạn"
            value={formatNumber(stats.orders_expired_30d)}
            tone={
              stats.orders_expired_30d > stats.orders_paid_30d ? "danger" : "default"
            }
            hint="đơn tạo ra nhưng không ai trả"
          />
          <StatTile
            label="Lượt đọc 30 ngày"
            value={formatNumber(stats.readings_deep_30d + stats.readings_quick_30d)}
            hint={`${formatNumber(stats.readings_deep_30d)} sâu · ${formatNumber(stats.readings_quick_30d)} nhanh`}
          />
        </div>
      </section>

      <section aria-labelledby="chi-phi-ai" className="mb-6">
        <h2 id="chi-phi-ai" className="mt-0 mb-3" style={S.heading3}>
          Chi phí AI (30 ngày, ước tính)
        </h2>
        <div className="rounded-lg p-5" style={S.surface}>
          {cost.rows.length === 0 ? (
            <p className="m-0" style={S.textMuted}>
              Chưa có lượt đọc nào dùng AI trong 30 ngày.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: "480px" }}>
                  <caption className="sr-only">
                    Lượng dùng và chi phí ước tính theo từng mô hình AI
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="p-2" style={S.tableHeaderCell}>
                        Mô hình AI
                      </th>
                      <th scope="col" className="p-2" style={S.tableHeaderCell}>
                        Token vào
                      </th>
                      <th scope="col" className="p-2" style={S.tableHeaderCell}>
                        Token ra
                      </th>
                      <th scope="col" className="p-2" style={S.tableHeaderCell}>
                        Chi phí ước tính
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cost.rows.map((row) => (
                      <tr key={row.model}>
                        <td className="p-2" style={S.tableCell}>
                          {row.model}
                        </td>
                        <td className="p-2" style={S.tableCell}>
                          {formatNumber(row.input)}
                        </td>
                        <td className="p-2" style={S.tableCell}>
                          {formatNumber(row.output)}
                        </td>
                        <td className="p-2" style={S.tableCell}>
                          {row.costVnd === null ? (
                            <span style={S.warningText}>chưa cấu hình giá</span>
                          ) : (
                            formatVnd(row.costVnd)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatTile
                  label="Tổng chi phí AI (30 ngày)"
                  value={formatVnd(cost.totalVnd)}
                  hint={`quy đổi ${formatNumber(USD_TO_VND)}đ/USD`}
                />
                <StatTile
                  label="Doanh thu trừ chi phí AI"
                  value={formatVnd(stats.revenue_30d_vnd - cost.totalVnd)}
                  hint="chưa trừ phí thanh toán, hạ tầng, vận hành"
                  tone={
                    stats.revenue_30d_vnd - cost.totalVnd < 0 ? "danger" : "accent"
                  }
                />
              </div>

              <p className="mt-3 mb-0" style={S.textDim}>
                Giá tham chiếu ngày {PRICES_UPDATED_AT}. Đây đang là giá khuyến
                mãi của nhà cung cấp và sẽ tăng gấp đôi từ 01/01/2027 — hệ thống
                tự áp giá mới khi tới ngày.
              </p>

              {cost.hasUnpriced && (
                <p className="mt-2 mb-0" style={{ ...S.textMuted, ...S.warningText }}>
                  Có mô hình AI chưa khai báo giá nên phần đó chưa quy ra tiền và
                  chưa được cộng vào tổng. Báo kỹ thuật để bổ sung.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="xu-huong" className="mb-6">
        <h2 id="xu-huong" className="mt-0 mb-3" style={S.heading3}>
          Xu hướng 30 ngày
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendChart
            title="Đăng ký mỗi ngày"
            points={series.map((p) => ({
              label: shortDay(p.day),
              value: p.signups,
            }))}
            formatValue={formatNumber}
          />
          <TrendChart
            title="Doanh thu mỗi ngày"
            points={series.map((p) => ({
              label: shortDay(p.day),
              value: p.revenue_vnd,
            }))}
            formatValue={formatVnd}
          />
        </div>
      </section>
    </>
  );
}
