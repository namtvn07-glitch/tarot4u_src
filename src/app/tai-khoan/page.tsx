"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccountScreen } from "@/screens/AccountScreen";
import { CreditTopUpModal } from "@/components/CreditTopUpModal";
import { AuthModal } from "@/components/AuthModal";
import { ReadingDetailModal } from "@/components/ReadingDetailModal";
import type { ReadingHistoryItem, UserProfile } from "@/types/tarot";
import { createClient } from "@/lib/supabase/client";
import { fromAuthModalLogin, GUEST_PROFILE, toUserProfile } from "@/lib/user-profile";
import { HISTORY_LIST_LIMIT, HISTORY_LIST_SELECT, rowsToHistoryItems } from "@/lib/reading-history";
import { readLocalReadings } from "@/lib/user-scoped-storage";

export default function TaiKhoanPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<ReadingHistoryItem | null>(null);
  
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);

  const [readings, setReadings] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const loadUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits, display_name, avatar_url")
            .eq("id", authUser.id)
            .single();

          setUser(toUserProfile(authUser, profile));

          // Fetch user's real readings from Supabase readings table
          const { data: dbReadings } = await supabase
            .from("readings")
            .select(HISTORY_LIST_SELECT)
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(HISTORY_LIST_LIMIT);

          if (dbReadings && dbReadings.length > 0) {
            const formatted = rowsToHistoryItems(dbReadings);
            setReadings(formatted);
          } else {
            // Bộ đệm cục bộ chỉ để lấp khoảng trễ ngay sau khi lưu, và chỉ
            // đọc được phần mang tem của CHÍNH tài khoản này — trước đây đọc
            // thẳng mảng trần nên tài khoản mới (chưa có quẻ nào trong DB)
            // lại thấy lịch sử của tài khoản đăng nhập trước đó trên cùng máy.
            setReadings(readLocalReadings(authUser.id));
          }
        }
      } catch {
        // Not logged in
      }
    };

    loadUserData();
  }, []);

  async function handleDeleteReading(id: string) {
    const res = await fetch(`/api/readings/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete_failed");
    setReadings((prev) => prev.filter((r) => r.id !== id));
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        currentScreen="account"
        user={user}
        onOpenTopUp={() => {
          if (!user.isLoggedIn) {
            setIsAuthOpen(true);
          } else {
            setIsTopUpOpen(true);
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onNavigate={(screen) => {
          if (typeof window !== "undefined") {
            if (screen === "home") window.location.href = "/";
            if (screen === "daily") window.location.href = "/hom-nay";
            if (screen === "deep-read") window.location.href = "/doc-sau";
            if (screen === "library") window.location.href = "/thu-vien";
          }
        }}
      />

      <main className="flex-grow flex flex-col relative z-10">
        <AccountScreen
          user={user}
          readings={readings}
          onOpenTopUp={() => {
            if (!user.isLoggedIn) {
              setIsAuthOpen(true);
            } else {
              setIsTopUpOpen(true);
            }
          }}
          onNavigate={(screen) => {
            if (typeof window !== "undefined") {
              if (screen === "home") window.location.href = "/";
              if (screen === "daily") window.location.href = "/hom-nay";
              if (screen === "deep-read") window.location.href = "/doc-sau";
              if (screen === "library") window.location.href = "/thu-vien";
            }
          }}
          onViewReadingDetail={(reading) => setSelectedReading(reading)}
          onDeleteReading={handleDeleteReading}
        />
      </main>

      <Footer />

      <CreditTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={(added) => setUser((prev) => ({ ...prev, credits: prev.credits + added }))}
        currentCredits={user.credits}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(fromAuthModalLogin(u))}
      />

      <ReadingDetailModal
        reading={selectedReading}
        isOpen={!!selectedReading}
        onClose={() => setSelectedReading(null)}
      />
    </div>
  );
}
