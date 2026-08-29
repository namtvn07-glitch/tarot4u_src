"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/tarot";

export function useAuthUser() {
  const [user, setUser] = useState<UserProfile>({
    name: "Khách",
    email: "",
    credits: 0,
    isLoggedIn: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("credits, display_name, avatar_url")
            .eq("id", authUser.id)
            .single();

          const userName =
            profile?.display_name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Thành Viên";

          const userCredits = typeof profile?.credits === "number" ? profile.credits : 0;

          setUser({
            id: authUser.id,
            name: userName,
            email: authUser.email || "",
            credits: userCredits,
            avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
            isLoggedIn: true,
          });
        } else {
          setUser({
            name: "Khách",
            email: "",
            credits: 0,
            isLoggedIn: false,
          });
        }
      } catch {
        // Unauthenticated
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, display_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        const userName =
          profile?.display_name ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "Thành Viên";

        const userCredits = typeof profile?.credits === "number" ? profile.credits : 0;

        setUser({
          id: session.user.id,
          name: userName,
          email: session.user.email || "",
          credits: userCredits,
          avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
          isLoggedIn: true,
        });
      } else {
        setUser({
          name: "Khách",
          email: "",
          credits: 0,
          isLoggedIn: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser({
      name: "Khách",
      email: "",
      credits: 0,
      isLoggedIn: false,
    });
  };

  const addCredits = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      credits: prev.credits + amount,
    }));
  };

  const deductCredit = (amount: number): boolean => {
    if (user.credits >= amount) {
      setUser((prev) => ({
        ...prev,
        credits: prev.credits - amount,
      }));
      return true;
    }
    return false;
  };

  return {
    user,
    loading,
    setUser,
    logout,
    addCredits,
    deductCredit,
  };
}
