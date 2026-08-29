import React from "react";
import Link from "next/link";
import { Sparkles, Shield, HeartHandshake, PhoneCall } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#3d3123]/70 bg-[#050505]/95 text-[#b3a48d] pt-12 pb-8 px-4 sm:px-8 mt-auto z-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand statement */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#8f5a1f] p-[1px]">
              <div className="w-full h-full bg-[#050505] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-widest text-[#f3ece1]">
              VENTUS TAROT
            </span>
          </div>
          <p className="text-xs text-[#b3a48d]/80 max-w-sm leading-relaxed">
            Nền tảng chiêm nghiệm tâm lý và khám phá thông điệp vũ trụ. 
            Mỗi trải bài là một chiếc gương phản chiếu nội tâm, hỗ trợ bạn đưa ra quyết định sáng suốt hơn.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#7a6e5d]">
            <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Bảo mật tuyệt đối — Dữ liệu trải bài được mã hóa</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2.5">
          <h4 className="font-display text-sm font-semibold text-[#f3ece1] uppercase tracking-wider">
            Trải Nghiệm
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/" className="hover:text-[#d4af37] transition-colors">
                Trang Chủ
              </Link>
            </li>
            <li>
              <Link href="/trai-bai" className="hover:text-[#d4af37] transition-colors">
                Rút Bài Nhanh (1 Lá)
              </Link>
            </li>
            <li>
              <Link href="/doc-sau" className="hover:text-[#d4af37] transition-colors">
                Trải Bài Sâu 3 Lá
              </Link>
            </li>
            <li>
              <Link href="/thu-vien" className="hover:text-[#d4af37] transition-colors">
                Thư Viện 78 Lá Bài
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Crisis */}
        <div className="space-y-2.5">
          <h4 className="font-display text-sm font-semibold text-[#f3ece1] uppercase tracking-wider">
            Pháp Lý & Hỗ Trợ
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/dieu-khoan" className="hover:text-[#d4af37] transition-colors">
                Điều Khoản Sử Dụng
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-quyen-rieng-tu" className="hover:text-[#d4af37] transition-colors">
                Chính Sách Quyền Riêng Tư
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-hoan-tien" className="hover:text-[#d4af37] transition-colors">
                Chính Sách Hoàn Tiền
              </Link>
            </li>
            <li className="pt-1">
              <Link 
                href="/tai-nguyen-khung-hoang" 
                className="text-[#f0605f] hover:text-[#ff8a80] flex items-center gap-1 font-medium transition-colors"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Trợ Giúp Khủng Hoảng (1900 / 115)</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-[#3d3123]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7a6e5d]">
        <p>© 2026 Ventus Tarot. Bảo lưu mọi quyền.</p>
        <p className="text-[11px]">
          Sản phẩm mang tính chất chiêm nghiệm tâm lý cá nhân, không thay thế tư vấn y tế hay pháp lý chuyên nghiệp.
        </p>
      </div>
    </footer>
  );
};
