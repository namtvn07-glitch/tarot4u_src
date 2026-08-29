"use client";

import React, { useState, useEffect } from "react";
import { User, Coins, Calendar, History, CreditCard, Settings, PlusCircle, ArrowRight, Layers, Sparkles, Trash2 } from "lucide-react";
import type { AppScreen, ReadingHistoryItem, UserProfile } from "@/types/tarot";
import { createClient } from "@/lib/supabase/client";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";

interface AccountScreenProps {
  user: UserProfile;
  readings: ReadingHistoryItem[];
  onOpenTopUp: () => void;
  onNavigate: (screen: AppScreen) => void;
  onViewReadingDetail: (reading: ReadingHistoryItem) => void;
  onDeleteReading?: (id: string) => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  readings,
  onOpenTopUp,
  onNavigate,
  onViewReadingDetail,
  onDeleteReading,
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "transactions">("history");
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (activeTab === "transactions" && user.id) {
      const fetchLedger = async () => {
        setLoadingLedger(true);
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("credit_ledger")
            .select("id, delta, balance_after, reason, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (data) {
            setLedgerRows(data);
          }
        } catch {
          // ignore
        } finally {
          setLoadingLedger(false);
        }
      };

      fetchLedger();
    }
  }, [activeTab, user.id]);

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "purchase": return "Nạp Credits (PayOS)";
      case "reading": return "Trừ — Trải bài sâu";
      case "refund": return "Hoàn Credits";
      case "bonus": return "Thưởng";
      default: return "Giao dịch hệ thống";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-8 pb-16 px-4 sm:px-8 flex flex-col gap-8 relative z-10 animate-in fade-in duration-300">
      {/* Profile Overview Card */}
      <section className="bg-[#15100b] border border-[#3d3123] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#251d16] border-2 border-[#d4af37]/60 flex items-center justify-center text-[#d4af37]">
              <User className="w-8 h-8" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl text-white font-bold">
                {user.name}
              </h1>
              {user.isLoggedIn && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
                  Thành Viên
                </span>
              )}
            </div>
            <p className="text-xs text-[#7a6e5d]">{user.email || "Chưa đăng nhập"}</p>
          </div>
        </div>

        {/* Balance & Top-up */}
        <div className="flex items-center gap-4 bg-[#1c1611] p-4 rounded-2xl border border-[#3d3123]">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#7a6e5d] block">
              Số Dư Credits
            </span>
            <div className="font-display text-2xl font-bold text-[#d4af37]">
              {user.credits} Credits
            </div>
          </div>

          <button
            onClick={onOpenTopUp}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(143,90,31,0.4)] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nạp Thêm</span>
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="flex flex-col gap-6">
        <div className="flex border-b border-[#3d3123] gap-6">
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "history"
                ? "border-[#d4af37] text-[#d4af37]"
                : "border-transparent text-[#7a6e5d] hover:text-[#b3a48d]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch Sử Trải Bài ({readings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "transactions"
                ? "border-[#d4af37] text-[#d4af37]"
                : "border-transparent text-[#7a6e5d] hover:text-[#b3a48d]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Lịch Sử Giao Dịch (Ledger)</span>
          </button>
        </div>

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readings.map((reading) => (
              <div
                key={reading.id}
                onClick={() => onViewReadingDetail(reading)}
                className="bg-[#15100b] border border-[#3d3123] hover:border-[#d4af37]/60 p-5 rounded-2xl transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#7a6e5d] mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#251d16] text-[#d4af37] text-[10px] font-semibold uppercase">
                      {reading.topicVi || "Tổng Quan"}
                    </span>
                    <span>{reading.date}</span>
                  </div>

                  <h3 className="font-display text-base text-white font-semibold mb-2 group-hover:text-[#d4af37] transition-colors line-clamp-2">
                    "{reading.question || "Trải bài 3 lá chuyên sâu"}"
                  </h3>

                  <div className="flex gap-2 mb-3">
                    {reading.cards.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#251d16] text-[#b3a48d]"
                      >
                        {c.nameVi || c.name}
                      </span>
                    ))}
                  </div>

                  {reading.personalBody && (
                    <p className="text-xs text-[#7a6e5d] line-clamp-2 italic">
                      "{reading.personalBody}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#3d3123]/50 flex justify-between items-center text-xs text-[#d4af37]">
                  <span>Xem chi tiết luận giải</span>
                  <span>→</span>
                </div>
              </div>
            ))}

            {readings.length === 0 && (
              <div className="col-span-2 py-16 text-center text-[#7a6e5d] bg-[#15100b] border border-[#3d3123] rounded-2xl">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#d4af37]" />
                <p className="text-xs">Bạn chưa có lịch sử trải bài nào được lưu.</p>
                <button
                  onClick={() => onNavigate("deep-read")}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#8f5a1f] text-white text-xs font-semibold hover:bg-[#d4af37] hover:text-[#050505] transition-colors"
                >
                  Thực hiện phiên trải bài đầu tiên
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab Content */}
        {activeTab === "transactions" && (
          <div className="bg-[#15100b] border border-[#3d3123] rounded-2xl p-6">
            <h3 className="font-display text-lg text-white font-semibold mb-4">
              Nhật Ký Biến Động Credits
            </h3>
            
            {loadingLedger ? (
              <p className="text-xs text-[#7a6e5d] py-6 text-center">Đang tải dữ liệu giao dịch từ Supabase...</p>
            ) : ledgerRows.length > 0 ? (
              <div className="space-y-3">
                {ledgerRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1611] border border-[#3d3123]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        row.delta > 0 ? "bg-[#5fbf8c]/20 text-[#5fbf8c]" : "bg-[#f0605f]/20 text-[#f0605f]"
                      }`}>
                        {row.delta > 0 ? `+${row.delta}` : row.delta}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-white">
                          {getReasonLabel(row.reason)}
                        </div>
                        <div className="text-[11px] text-[#7a6e5d] font-mono">
                          {new Date(row.created_at).toLocaleString("vi-VN")} • Số dư sau: {row.balance_after}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-bold ${
                      row.delta > 0 ? "text-[#5fbf8c]" : "text-[#f0605f]"
                    }`}>
                      {row.delta > 0 ? `+${row.delta}` : row.delta} Credits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#7a6e5d]">
                <p className="text-xs">Chưa có giao dịch biến động credits nào được ghi nhận.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {user.isLoggedIn && (
        <section className="pt-6 border-t border-[#3d3123]/60">
          <h2 className="font-display text-sm text-[#7a6e5d] font-semibold uppercase tracking-wider mb-3">
            Vùng nguy hiểm
          </h2>
          <DeleteAccountButton />
        </section>
      )}
    </div>
  );
};
