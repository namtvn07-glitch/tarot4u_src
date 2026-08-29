"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function DangNhapPage() {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={{
          name: "Khách",
          email: "",
          credits: 0,
          isLoggedIn: false,
        }}
        onOpenTopUp={() => {}}
        onOpenAuth={() => setIsOpen(true)}
        onLogout={() => {}}
      />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <AuthModal
          isOpen={isOpen}
          onClose={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
          onLoginSuccess={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/tai-khoan";
            }
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
