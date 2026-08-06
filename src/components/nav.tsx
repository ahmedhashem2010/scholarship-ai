"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LogOut, ChevronDown, ChevronRight, ChevronLeft, CreditCard, Globe, Menu, X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/lib/profile-context";
import { useCredits } from "@/lib/credits-context";
import { ThemeToggle } from "@/components/scholarship/theme-toggle";
import { BRAND } from "@/lib/brand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/** Wordmark. Arabic name in Arabic, Latin name in English — never transliterate. */
/**
 * The real mark, finally — an S drawn as a road.
 *
 * Sits on a white tile rather than being recoloured. The artwork is navy with
 * white lane dashes and a gold destination node; recolouring it for a dark
 * header would mean inventing a second colourway for the dashes and losing the
 * gold, which is the one colour that never changes. A white tile keeps the
 * brand exactly as drawn on any background.
 *
 * `next/image` is skipped deliberately: this is a small static SVG, and the
 * optimiser adds a network round trip and a layout-shift risk for no gain.
 */
function Logo({ href, onDark }: { href: string; onDark?: boolean }) {
  const { pick } = useLanguage();
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 font-semibold ${
        onDark ? "text-white" : "text-foreground"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white ${
          onDark ? "" : "ring-1 ring-border"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-mark.svg"
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px]"
        />
      </span>
      <span className="whitespace-nowrap text-[15px] tracking-tight">
        {pick(BRAND.nameAr, BRAND.name)}
      </span>
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

/**
 * Animated hamburger. The two icons cross-fade with a quarter turn, so the
 * affordance changes instantly instead of jarring from ☰ to ✕.
 */
function MenuButton({
  open,
  onToggle,
  onDark,
}: {
  open: boolean;
  onToggle: () => void;
  onDark?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? t("common.close") : t("nav.menu")}
      aria-expanded={open}
      aria-controls="mobile-menu"
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors lg:hidden ${
        onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={open ? "close" : "menu"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.16 }}
          className="flex"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/**
 * Full-screen mobile sheet. Sits below the header (which stays visible with the
 * X button), slides down with a soft fade, and staggers its links in from the
 * reading-start edge. Closes on Escape. All motion respects reduced-motion.
 */
function MobileMenu({
  open,
  onClose,
  topClass,
  links,
  children,
}: {
  open: boolean;
  onClose: () => void;
  topClass: string;
  links: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  const { t, isRTL } = useLanguage();
  const startX = isRTL ? 12 : -12;
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            role="dialog"
            aria-label={t("nav.menu")}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-x-0 bottom-0 z-[60] overflow-y-auto border-b border-border bg-card ${topClass}`}
            style={{ overscrollBehavior: "contain" }}
          >
            <nav aria-label="Mobile navigation" className="flex min-h-full flex-col px-6 py-6">
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
                className="space-y-1"
              >
                {links.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: startX },
                      show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      {link.label}
                      <Arrow className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-auto pt-8">{children}</div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export function Nav() {
  const { t, num, isRTL } = useLanguage();
  const { profile } = useProfile();
  const { credits } = useCredits();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // On the landing page the nav starts transparent over the navy hero and
  // turns into frosted glass once the visitor scrolls past the top — or the
  // moment the mobile menu opens, so the X button never floats on navy.
  const [scrolled, setScrolled] = useState(false);
  // Thin gold progress line under the header, tracking page scroll.
  const { scrollYProgress } = useScroll();
  const headerProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const router = useRouter();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

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
    setMobileOpen(false);
  }, [pathname]);

  // Scroll lock while the mobile sheet is open — the page behind shouldn't
  // move while the menu is on screen.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  // --- Signed out -----------------------------------------------------------
  // On the landing page the nav floats over the hero band: transparent white
  // text at the top, frosted glass with navy text once scrolled. Anywhere else
  // it is a plain sticky glass bar.
  if (!user) {
    const onHero = isLanding && !scrolled && !mobileOpen;
    const headerClass = isLanding
      ? `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          onHero
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-border bg-background/80 text-foreground shadow-[0_8px_32px_-16px_rgb(22_44_76/0.18)] backdrop-blur-xl"
        }`
      : "sticky top-0 z-30 border-b border-border bg-background/90 text-foreground backdrop-blur-md";

    const landingLinks = [
      { href: "#features", label: t("nav.features") },
      { href: "#how-it-works", label: t("nav.how") },
      { href: "/scholarships", label: t("nav.scholarships") },
      { href: "/pricing", label: t("nav.pricing") },
    ];
    // On non-landing signed-out pages the section anchors don't exist, so the
    // mobile sheet falls back to the two page-level destinations.
    const mobileLinks = isLanding
      ? landingLinks
      : [
          { href: "/scholarships", label: t("nav.scholarships") },
          { href: "/pricing", label: t("nav.pricing") },
        ];

    return (
      <header role="banner" aria-label="Main navigation" className={headerClass}>
        {isLanding && (
          <motion.div
            aria-hidden="true"
            style={{ scaleX: headerProgress, transformOrigin: isRTL ? "right" : "left" }}
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-600"
          />
        )}
        <div className="page-container flex h-16 items-center justify-between">
          <Logo href="/" onDark={onHero} />

          {isLanding && (
            <nav aria-label="Landing" className="hidden items-center gap-1 lg:flex">
              {landingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-underline px-3 pb-1.5 pt-1.5 text-sm font-medium transition-colors ${
                    onHero
                      ? "text-white/85 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-1.5">
            {!isLanding && <ThemeToggle />}
            <LanguageToggle onDark={onHero} />
            <Link
              href="/auth/login"
              className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:inline-flex ${
                onHero
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/auth/signup"
              className="group relative hidden items-center gap-2 overflow-hidden rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-[0_10px_30px_-10px_rgb(198_161_75/0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary-600 hover:shadow-[0_16px_40px_-12px_rgb(198_161_75/0.8)] active:scale-[0.97] sm:inline-flex"
            >
              {t("nav.signup")}
              <span aria-hidden="true" className="btn-shine-overlay" />
            </Link>
            <MenuButton open={mobileOpen} onToggle={() => setMobileOpen((o) => !o)} onDark={onHero} />
          </div>
        </div>

        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          topClass="top-16"
          links={mobileLinks}
        >
          <div className="space-y-3 border-t border-border pt-6">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileOpen(false)}
              className="group relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-secondary text-sm font-bold text-secondary-foreground shadow-[0_10px_30px_-10px_rgb(198_161_75/0.65)] transition-all duration-300 hover:bg-secondary-600 active:scale-[0.98]"
            >
              {t("nav.signup")}
              <span aria-hidden="true" className="btn-shine-overlay" />
            </Link>
          </div>
        </MobileMenu>
      </header>
    );
  }

  // --- Signed in ------------------------------------------------------------
  const appLinks = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/dashboard/roadmap", label: t("nav.roadmap") },
    { href: "/dashboard/documents", label: t("nav.documents") },
    { href: "/scholarships", label: t("nav.scholarships") },
  ];

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
              <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
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

          <MenuButton open={mobileOpen} onToggle={() => setMobileOpen((o) => !o)} />
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        topClass="top-14"
        links={appLinks}
      >
        <div className="space-y-3 border-t border-border pt-6">
          <Link
            href="/dashboard/credits"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <CreditCard className="h-4 w-4 text-secondary-600" />
            {credits !== null && credits !== undefined
              ? `${num(credits)} ${t("nav.credits")}`
              : t("nav.credits")}
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {t("nav.profile")}
          </Link>
          <button
            onClick={handleLogout}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
          <div className="flex items-center justify-center gap-1 pt-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </MobileMenu>
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
