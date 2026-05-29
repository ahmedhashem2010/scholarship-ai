"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ChevronDown,
  CreditCard,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/lib/profile-context";
import { useCredits } from "@/lib/credits-context";
import { ThemeToggle } from "@/components/scholarship/theme-toggle";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Nav() {
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useProfile();
  const { credits } = useCredits();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <header aria-label="Main navigation" className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md dark:bg-gray-900/90 dark:border-gray-700" role="banner">
        <div className="flex h-14 items-center justify-between page-container">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="text-sm">ScholarshipAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={toggleLanguage}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              aria-label={`Switch to ${language === "en" ? "Arabic" : "English"}`}
            >
              <Globe className="h-4 w-4" />
              <span className="ml-1 text-[10px]">{language === "en" ? "AR" : "EN"}</span>
            </button>
            <Link href="/auth/login">
              <Button size="sm" variant="ghost">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md dark:bg-gray-900/90 dark:border-gray-700">
      <div className="flex h-14 items-center justify-between page-container">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="w-8" />
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="text-sm">ScholarshipAI</span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground mr-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="text-sm">ScholarshipAI</span>
          </Link>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/documents">Documents</NavLink>
          <NavLink href="/scholarships">Scholarships</NavLink>
          <NavLink href="/dashboard/compare">Compare</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleLanguage}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            aria-label={`Switch to ${language === "en" ? "Arabic" : "English"}`}
          >
            <Globe className="h-4 w-4" />
            <span className="ml-1 text-[10px]">{language === "en" ? "AR" : "EN"}</span>
          </button>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" />
              {credits !== null ? `${credits} credits` : "Get Credits"}
            </Button>
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label={profileOpen ? "Close profile menu" : "Open profile menu"}
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary text-xs font-medium">
                {profile?.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block max-w-[120px] truncate">
                {profile?.displayName ?? user.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border bg-white p-1 shadow-lg ring-1 ring-black/5 animate-scale-in dark:bg-gray-800 dark:border-gray-700 dark:ring-white/5">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs font-medium text-foreground truncate">{profile?.displayName ?? "User"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/pricing"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    Get Credits
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-danger-50 hover:text-danger transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary-50 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
