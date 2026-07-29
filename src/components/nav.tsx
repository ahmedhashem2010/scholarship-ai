"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, CreditCard, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/lib/profile-context";
import { useCredits } from "@/lib/credits-context";
import { ThemeToggle } from "@/components/scholarship/theme-toggle";
import { BRAND } from "@/lib/brand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/** Wordmark. Arabic name in Arabic, Latin name in English — never transliterate. */
function Logo({ href, onDark }: { href: string; onDark?: boolean }) {
  const { pick } = useLanguage();
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 font-bold ${onDark ? "text-white" : "text-foreground"}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          onDark ? "bg-white text-[rgb(var(--brand-deep))]" : "bg-primary text-primary-foreground"
        }`}
      >
        S
      </div>
      <span className="text-sm whitespace-nowrap">{pick(BRAND.nameAr, BRAND.name)}</span>
    </Link>
  );
}

function LanguageToggle({ onDark }: { onDark?: boolean }) {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors ${
        onDark
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-muted"
      }`}
      aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="h-4 w-4" />
      {/* Language codes are always Latin — never mirror or localise them. */}
      <span dir="ltr" className="text-[10px]">
        {language === "ar" ? "EN" : "AR"}
      </span>
    </button>
  );
}

export function Nav() {
  const { t, num } = useLanguage();
  const { profile } = useProfile();
  const { credits } = useCredits();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
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

  // --- Signed out -----------------------------------------------------------
  // On the landing page the nav sits ON the hero band rather than above it —
  // a white strip butted against a dark gradient reads as a seam.
  if (!user) {
    return (
      <header
        role="banner"
        aria-label="Main navigation"
        className={
          isLanding
            ? "absolute inset-x-0 top-0 z-30 bg-transparent text-white"
            : "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md"
        }
      >
        <div className="page-container flex h-16 items-center justify-between">
          <Logo href="/" onDark={isLanding} />
          <div className="flex items-center gap-1.5">
            {!isLanding && <ThemeToggle />}
            <LanguageToggle onDark={isLanding} />
            <Link href="/auth/login">
              <button
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isLanding
                    ? "text-white/85 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t("nav.login")}
              </button>
            </Link>
            <Link href="/auth/signup">
              <button
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isLanding
                    ? "bg-white text-[rgb(var(--brand-deep))] hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {t("nav.signup")}
              </button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // --- Signed in ------------------------------------------------------------
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="page-container flex h-14 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <div className="me-4">
            <Logo href="/dashboard" />
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink href="/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink href="/dashboard/roadmap">{t("nav.roadmap")}</NavLink>
            <NavLink href="/dashboard/documents">{t("nav.documents")}</NavLink>
            <NavLink href="/scholarships">{t("nav.scholarships")}</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />

          <Link href="/dashboard/credits" className="hidden sm:block">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" />
              {credits !== null && credits !== undefined
                ? `${num(credits)} ${t("nav.credits")}`
                : t("nav.credits")}
            </Button>
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label={profileOpen ? t("common.close") : t("nav.profile")}
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {profile?.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:block">
                {profile?.displayName ?? user.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                {/* `end-0` not `end-0` — in RTL this must anchor to the left. */}
                <div className="absolute end-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-card p-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-xs font-medium text-foreground">
                      {profile?.displayName ?? user.email}
                    </p>
                    {/* Email is always LTR, even in an RTL layout. */}
                    <p dir="ltr" className="truncate text-start text-[11px] text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {t("nav.profile")}
                  </Link>
                  <Link
                    href="/dashboard/credits"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <CreditCard className="h-4 w-4" />
                    {t("nav.credits")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
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
  const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
