import React from "react";
import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PhoneCall, HeartHandshake, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Tài Nguyên Hỗ Trợ Khủng Hoảng",
  description:
    "Danh sách các đường dây nóng và tổ chức chuyên môn hỗ trợ tâm lý khẩn cấp.",
};

export default function CrisisResourcePage() {
  return (
    <LegalPageLayout title="Tài Nguyên Hỗ Trợ Khủng Hoảng" updatedAt="29/08/2026">
      <div className="p-4 rounded-2xl bg-[#f0605f]/15 border border-[#f0605f]/40 flex items-start gap-3 text-[#f0605f] mb-6">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong>Lưu ý quan trọng:</strong> Nếu bạn hoặc người thân đang trải qua khủng hoảng tâm lý nghiêm trọng, có suy nghĩ tự hại hoặc bế tắc tinh thần, trải bài Tarot không phải là giải pháp phù hợp. Xin hãy liên hệ ngay với các đường dây nóng và tổ chức chuyên môn dưới đây:
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-[#1c1611] border border-[#3d3123]">
          <div className="flex items-center gap-2 text-base font-semibold text-white mb-1">
            <PhoneCall className="w-4 h-4 text-[#d4af37]" />
            <span>Đường dây nóng Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên</span>
          </div>
          <p className="text-xs text-[#b3a48d] mb-2">Hỗ trợ tư vấn tâm lý 24/7 hoàn toàn miễn phí cước gọi.</p>
          <div className="text-lg font-mono font-bold text-[#d4af37]">Tổng đài: 111</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1c1611] border border-[#3d3123]">
          <div className="flex items-center gap-2 text-base font-semibold text-white mb-1">
            <HeartHandshake className="w-4 h-4 text-[#5fbf8c]" />
            <span>Đường dây nóng Ngày Mai (Hỗ trợ người trầm cảm)</span>
          </div>
          <p className="text-xs text-[#b3a48d] mb-2">
            Lắng nghe và đồng hành cùng người gặp khó khăn tâm lý. Hoạt động
            13:00–20:30, Thứ 4 → Chủ nhật — ngoài khung giờ này hoặc trong
            tình huống nguy cấp, hãy gọi 115 hoặc 111.
          </p>
          <div className="text-lg font-mono font-bold text-[#5fbf8c]">Hotline: 096 306 1414</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1c1611] border border-[#3d3123]">
          <div className="flex items-center gap-2 text-base font-semibold text-white mb-1">
            <PhoneCall className="w-4 h-4 text-[#f0605f]" />
            <span>Cấp cứu y tế khẩn cấp</span>
          </div>
          <p className="text-xs text-[#b3a48d] mb-2">Trong các tình huống y tế khẩn cấp, hãy gọi ngay cấp cứu.</p>
          <div className="text-lg font-mono font-bold text-[#f0605f]">Tổng đài: 115</div>
        </div>
      </div>
    </LegalPageLayout>
  );
}
