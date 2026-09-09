import * as S from "./styles";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface TrendChartProps {
  title: string;
  points: TrendPoint[];
  formatValue: (value: number) => string;
}

// SVG viết tay thay vì thư viện biểu đồ: 30 cột thẳng đứng không đáng để thêm
// một dependency vĩnh viễn (và mọi CDN đều bị chặn ở môi trường này).
export function TrendChart({ title, points, formatValue }: TrendChartProps) {
  // id tất định từ tiêu đề thay vì useId(): giữ component này là Server
  // Component (hook không chạy được ở đó) và biểu đồ vốn không có tương tác nào
  // cần JS — <details> bên dưới là HTML thuần.
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const titleId = `chart-${slug}-title`;
  const descId = `chart-${slug}-desc`;

  const max = Math.max(...points.map((p) => p.value), 0);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  const WIDTH = 720;
  const HEIGHT = 160;
  const GAP = 2;
  const barWidth = points.length > 0 ? WIDTH / points.length - GAP : 0;

  if (points.length === 0) {
    return (
      <section className="rounded-lg p-5" style={S.surface}>
        <h3 className="mt-0 mb-2" style={S.heading3}>
          {title}
        </h3>
        <p className="m-0" style={S.textMuted}>
          Chưa có dữ liệu.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg p-5" style={S.surface}>
      <h3 className="mt-0 mb-1" style={S.heading3}>
        {title}
      </h3>
      <p className="mt-0 mb-4" style={S.textMuted}>
        Tổng {formatValue(total)} · cao nhất {formatValue(max)}
      </p>

      {/* overflow-x-auto: biểu đồ tự cuộn trong khung của nó ở màn hình hẹp,
          không bao giờ đẩy cả trang cuộn ngang. */}
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-40 w-full"
          style={{ minWidth: "320px" }}
          preserveAspectRatio="none"
        >
          <title id={titleId}>{title}</title>
          <desc id={descId}>
            Biểu đồ cột {points.length} ngày gần nhất. Tổng {formatValue(total)}.
            Số liệu chi tiết có trong bảng ngay bên dưới biểu đồ.
          </desc>
          {points.map((point, index) => {
            // max = 0 (chưa có hoạt động) => mọi cột cao 0, không chia cho 0.
            const height = max > 0 ? (point.value / max) * (HEIGHT - 4) : 0;
            return (
              <rect
                key={point.label}
                x={index * (barWidth + GAP)}
                y={HEIGHT - height}
                width={barWidth}
                height={height}
                fill="var(--color-accent)"
                opacity={point.value > 0 ? 0.85 : 0.25}
              />
            );
          })}
          {/* Đường nền để ngày có giá trị 0 vẫn nhìn thấy trục, không thành khoảng trống vô nghĩa. */}
          <line
            x1="0"
            y1={HEIGHT}
            x2={WIDTH}
            y2={HEIGHT}
            stroke="var(--color-border)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Bảng số liệu: không phụ thuộc vào việc nhìn thấy màu/chiều cao cột.
          Dùng <details> thay vì ẩn hoàn toàn để người dùng bàn phím và người
          muốn số chính xác đều lấy được. */}
      <details className="mt-3">
        <summary
          className="cursor-pointer"
          style={{ ...S.textMuted, minHeight: "44px", paddingTop: "12px" }}
        >
          Xem số liệu dạng bảng
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "320px" }}>
            <caption className="sr-only">{title} theo từng ngày</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2" style={S.tableHeaderCell}>
                  Ngày
                </th>
                <th scope="col" className="p-2" style={S.tableHeaderCell}>
                  Giá trị
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.label}>
                  <td className="p-2" style={S.tableCell}>
                    {point.label}
                  </td>
                  <td className="p-2" style={S.tableCell}>
                    {formatValue(point.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
