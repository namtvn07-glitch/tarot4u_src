import React from "react";
import { Sparkles } from "lucide-react";
import { DailyResultView } from "@/components/daily/DailyResultView";
import { ThreeCardResultView } from "@/components/reading/ThreeCardResultView";
import type { ReadingHistoryItem } from "@/types/tarot";

interface ReadingResultSectionProps {
  reading: ReadingHistoryItem;
  // Lớp bọc cho khối chữ của bản ghi cũ — hai nơi dùng (modal, trang chi tiết) có
  // khoảng đệm khác nhau.
  legacyClassName?: string;
}

// Hiển thị phần luận giải của một mục lịch sử. Bản ghi mới có `result` có cấu
// trúc → dùng đúng bố cục lúc vừa đọc; bản ghi cũ (trước khi có `result`) chỉ có
// chữ thuần → giữ cách hiển thị cũ. Không dùng dangerouslySetInnerHTML ở đâu cả.
export const ReadingResultSection: React.FC<ReadingResultSectionProps> = ({
  reading,
  legacyClassName = "bg-[#1c1611] p-5 rounded-xl",
}) => {
  const { result, personalBody } = reading;

  if (result?.spread === "three_card") {
    return (
      <div className="pt-6 border-t border-[#3d3123]">
        <ThreeCardResultView result={result} animate={false} />
      </div>
    );
  }

  if (result?.spread === "daily") {
    return (
      <div className="pt-6 border-t border-[#3d3123]">
        <DailyResultView content={result.content} />
      </div>
    );
  }

  if (!personalBody) return null;
  return (
    <div className="pt-6 border-t border-[#3d3123]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#d4af37] mb-3">
        <Sparkles className="w-4 h-4" />
        <span>Luận giải chuyên sâu:</span>
      </div>
      <div
        className={`text-xs sm:text-sm text-[#f3ece1]/90 leading-relaxed whitespace-pre-line border border-[#3d3123]/70 font-display ${legacyClassName}`}
      >
        {personalBody.normalize("NFC")}
      </div>
    </div>
  );
};
