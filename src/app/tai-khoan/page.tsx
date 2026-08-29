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

export default function TaiKhoanPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<ReadingHistoryItem | null>(null);
  
  const [user, setUser] = useState<UserProfile>({
    name: "Khách",
    email: "",
    credits: 0,
    isLoggedIn: false,
  });

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

          setUser({
            id: authUser.id,
            name: profile?.display_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Thành Viên",
            email: authUser.email || "",
            credits: typeof profile?.credits === "number" ? profile.credits : 0,
            avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
            isLoggedIn: true,
          });

          // Fetch user's real readings from Supabase readings table
          const { data: dbReadings } = await supabase
            .from("readings")
            .select("id, created_at, topic, tier, question, cards_drawn, personal_body")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false });

          if (dbReadings && dbReadings.length > 0) {
            const formatted = dbReadings.map((r: any) => ({
              id: r.id,
              date: new Date(r.created_at).toLocaleDateString("vi-VN"),
              topic: r.topic,
              topicVi: r.topic === "love" ? "Tình Yêu" : r.topic === "career" ? "Sự Nghiệp" : r.topic === "finance" ? "Tài Chính" : "Tổng Quan",
              question: r.question,
              cards: (r.cards_drawn || []).map((c: any, i: number) => ({
                name: c.card_id,
                nameVi: c.card_id,
                image: `/cards/${c.card_id}.jpg`,
                orientation: c.orientation || "upright",
                position: i === 0 ? "Quá Khứ" : i === 1 ? "Hiện Tại" : "Tương Lai",
              })),
              personalBody: r.personal_body,
            }));
            setReadings(formatted);
          } else {
            // Also check localStorage if recently saved
            const local = localStorage.getItem("ventus_readings");
            if (local) {
              try {
                setReadings(JSON.parse(local));
              } catch {
                // ignore
              }
            }
          }
        }
      } catch {
        // Not logged in
      }
    };

    loadUserData();
  }, []);

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
            if (screen === "quick-read") window.location.href = "/trai-bai";
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
              if (screen === "quick-read") window.location.href = "/trai-bai";
              if (screen === "deep-read") window.location.href = "/doc-sau";
              if (screen === "library") window.location.href = "/thu-vien";
            }
          }}
          onViewReadingDetail={(reading) => setSelectedReading(reading)}
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
        onLoginSuccess={(u) => setUser({ ...u, isLoggedIn: true, credits: u.credits ?? 0 })}
      />

      <ReadingDetailModal
        reading={selectedReading}
        isOpen={!!selectedReading}
        onClose={() => setSelectedReading(null)}
      />
    </div>
  );
}
