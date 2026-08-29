"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Coins, PlusCircle, User, LogOut, Menu, X, BookOpen, Layers } from "lucide-react";
import type { AppScreen, UserProfile } from "@/types/tarot";

interface HeaderProps {
  currentScreen?: AppScreen;
  onNavigate?: (screen: AppScreen) => void;
  user: UserProfile;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen = "home",
  onNavigate,
  user,
  onOpenTopUp,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (screen: AppScreen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-[#3d3123]/70 bg-[#050505]/85 backdrop-blur-xl transition-all duration-300">
      {/* Brand Logo */}
      <div
        onClick={() => handleNavClick("home")}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#8f5a1f] to-[#3d3123] p-[1px] shadow-[0_0_15px_rgba(212,175,55,0.35)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300">
          <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#d4af37] animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#f5e6a3] via-[#d4af37] to-[#8f5a1f]">
            VENTUS
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#b3a48d]/80 -mt-1 font-mono">
            TAROT
          </span>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex gap-6 items-center pl-6 border-l border-[#3d3123]/50">
        <button
          onClick={() => handleNavClick("home")}
          className={`text-sm tracking-wide transition-all px-3 py-1.5 rounded cursor-pointer ${
            currentScreen === "home"
              ? "text-[#d4af37] border-b-2 border-[#d4af37] font-semibold"
              : "text-[#b3a48d] hover:text-[#d4af37] hover:bg-white/5"
          }`}
        >
          Trang Chủ
        </button>

        <button
          onClick={() => handleNavClick("quick-read")}
          className={`text-sm tracking-wide transition-all px-3 py-1.5 rounded cursor-pointer ${
            currentScreen === "quick-read"
              ? "text-[#d4af37] border-b-2 border-[#d4af37] font-semibold"
              : "text-[#b3a48d] hover:text-[#d4af37] hover:bg-white/5"
          }`}
        >
          Rút Nhanh
        </button>

        <button
          onClick={() => handleNavClick("deep-read")}
          className={`text-sm tracking-wide transition-all px-3 py-1.5 rounded cursor-pointer ${
            currentScreen === "deep-read"
              ? "text-[#d4af37] border-b-2 border-[#d4af37] font-semibold"
              : "text-[#b3a48d] hover:text-[#d4af37] hover:bg-white/5"
          }`}
        >
          Trải Bài Sâu
        </button>

        <button
          onClick={() => handleNavClick("library")}
          className={`text-sm tracking-wide transition-all px-3 py-1.5 rounded cursor-pointer ${
            currentScreen === "library" || currentScreen === "card-detail"
              ? "text-[#d4af37] border-b-2 border-[#d4af37] font-semibold"
              : "text-[#b3a48d] hover:text-[#d4af37] hover:bg-white/5"
          }`}
        >
          Thư Viện 78 Lá
        </button>

        {user.isLoggedIn && (
          <button
            onClick={() => handleNavClick("account")}
            className={`text-sm tracking-wide transition-all px-3 py-1.5 rounded cursor-pointer ${
              currentScreen === "account"
                ? "text-[#d4af37] border-b-2 border-[#d4af37] font-semibold"
                : "text-[#b3a48d] hover:text-[#d4af37] hover:bg-white/5"
            }`}
          >
            Tài Khoản
          </button>
        )}
      </nav>

      {/* Trailing Actions */}
      <div className="flex items-center gap-3">
        {/* Credits Badge with Click-to-Top-Up */}
        <button
          onClick={onOpenTopUp}
          title="Bấm để Nạp thêm Credits"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37]/20 to-[#8f5a1f]/20 border border-[#d4af37]/45 text-[#d4af37] text-xs font-semibold hover:border-[#d4af37] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] transition-all cursor-pointer active:scale-95"
        >
          <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{user.credits} Credits</span>
          <PlusCircle className="w-3.5 h-3.5 text-[#d4af37]/80 ml-0.5" />
        </button>

        {user.isLoggedIn ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick("account")}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#d4af37]/50 transition-all cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#d4af37]/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1c1611] border border-[#d4af37]/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#d4af37]" />
                </div>
              )}
              <span className="hidden lg:inline text-xs text-[#f3ece1] font-medium max-w-[100px] truncate">
                {user.name.split(" ")[0]}
              </span>
            </button>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="text-xs text-[#b3a48d] hover:text-[#f0605f] px-2.5 py-1.5 rounded-lg bg-[#15100b] border border-[#3d3123] hover:border-[#f0605f]/50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 inline mr-1" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4.5 py-1.5 rounded-full bg-gradient-to-r from-[#8f5a1f] to-[#764a19] hover:from-[#d4af37] hover:to-[#8f5a1f] text-white hover:text-[#050505] text-xs font-semibold tracking-wide border border-[#d4af37]/45 transition-all duration-300 shadow-[0_0_15px_rgba(143,90,31,0.4)] active:scale-95 cursor-pointer"
          >
            Đăng Nhập
          </button>
        )}

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-[#f3ece1] hover:text-[#d4af37] cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#0e0a08]/98 backdrop-blur-2xl border-b border-[#3d3123] p-6 flex flex-col gap-3 md:hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => handleNavClick("home")}
            className={`text-left text-base py-2 ${
              currentScreen === "home" ? "text-[#d4af37] font-bold" : "text-[#f3ece1]"
            }`}
          >
            Trang Chủ
          </button>
          <button
            onClick={() => handleNavClick("quick-read")}
            className={`text-left text-base py-2 ${
              currentScreen === "quick-read" ? "text-[#d4af37] font-bold" : "text-[#f3ece1]"
            }`}
          >
            Rút Nhanh (1 Lá)
          </button>
          <button
            onClick={() => handleNavClick("deep-read")}
            className={`text-left text-base py-2 ${
              currentScreen === "deep-read" ? "text-[#d4af37] font-bold" : "text-[#f3ece1]"
            }`}
          >
            Trải Bài Sâu (3 Lá)
          </button>
          <button
            onClick={() => handleNavClick("library")}
            className={`text-left text-base py-2 ${
              currentScreen === "library" ? "text-[#d4af37] font-bold" : "text-[#f3ece1]"
            }`}
          >
            Thư Viện 78 Lá Bài
          </button>
          {user.isLoggedIn && (
            <button
              onClick={() => handleNavClick("account")}
              className={`text-left text-base py-2 ${
                currentScreen === "account" ? "text-[#d4af37] font-bold" : "text-[#f3ece1]"
              }`}
            >
              Lịch Sử & Tài Khoản
            </button>
          )}

          <div className="pt-4 border-t border-[#3d3123] flex justify-between items-center">
            <button
              onClick={() => {
                onOpenTopUp();
                setMobileMenuOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8f5a1f]/20 border border-[#d4af37]/45 text-[#d4af37] text-xs font-semibold"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{user.credits} Credits +</span>
            </button>

            {!user.isLoggedIn ? (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-1.5 rounded-full bg-[#8f5a1f] text-white text-xs font-semibold"
              >
                Đăng Nhập
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-[#f0605f]"
              >
                Đăng Xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
