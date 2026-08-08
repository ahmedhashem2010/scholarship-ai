"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  GraduationCap,
  FolderKanban,
  Map,
  FileText,
  Settings,
  LifeBuoy,
} from "lucide-react"
import { BRAND } from "@/lib/brand"
import { useLanguage } from "@/contexts/LanguageContext"
import { useProfile } from "@/lib/profile-context"
import { ThemeToggle } from "@/components/scholarship/theme-toggle"
import { cn } from "@/lib/utils"

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : ""
  return (first + last).toUpperCase()
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  active?: boolean
  badge?: number
}

function NavLink({ href, icon: Icon, label, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/8 text-primary-700 dark:text-primary-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2.5 start-0 w-1 rounded-e-full transition-opacity",
          active ? "bg-secondary-500 opacity-100" : "opacity-0"
        )}
      />
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active ? "text-secondary-600 dark:text-secondary-500" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-500 px-1.5 text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 first:pt-0">
      {children}
    </p>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t, pick } = useLanguage()
  const { profile } = useProfile()
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  useEffect(() => {
    document.body.dataset.dashboard = "true"
    return () => {
      delete document.body.dataset.dashboard
    }
  }, [])

  const mainItems: NavItemProps[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/scholarships", icon: GraduationCap, label: t("nav.scholarships") },
    { href: "/dashboard/applications", icon: FolderKanban, label: t("nav.applications") },
    { href: "/dashboard/roadmap", icon: Map, label: t("nav.roadmap") },
    { href: "/dashboard/documents", icon: FileText, label: t("nav.documents") },
  ]

  const accountItems: NavItemProps[] = [
    { href: "/dashboard/profile", icon: Settings, label: t("nav.settings") },
  ]

  const mobileItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard"), active: isActive("/dashboard") },
    { href: "/dashboard/applications", icon: FolderKanban, label: t("nav.applications"), active: isActive("/dashboard/applications") },
    { href: "/dashboard/roadmap", icon: Map, label: t("nav.roadmap"), active: isActive("/dashboard/roadmap") },
    { href: "/dashboard/documents", icon: FileText, label: t("nav.documents"), active: isActive("/dashboard/documents") },
  ]

  const displayName = profile?.displayName

  return (
    <div className="dash-bg min-h-screen">
      {/* Desktop sidebar -------------------------------------------------- */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[264px] flex-col border-e border-border bg-card/70 backdrop-blur-md lg:flex">
        <div className="px-5 pb-2 pt-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-foreground"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-mark.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </span>
            <span className="whitespace-nowrap text-[15px] tracking-tight">
              {pick(BRAND.nameAr, BRAND.name)}
            </span>
          </Link>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-3">
          <GroupLabel>{t("nav.menu")}</GroupLabel>
          <div className="space-y-0.5">
            {mainItems.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </div>

          <GroupLabel>{t("nav.profile")}</GroupLabel>
          <div className="space-y-0.5">
            {accountItems.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
            <NavLink
              href={`mailto:${BRAND.supportEmail}`}
              icon={LifeBuoy}
              label={t("nav.help")}
            />
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ThemeToggle />
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar --------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white ring-1 ring-border">
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

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              aria-label="Profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-secondary-500/70"
            >
              {displayName ? initialsOf(displayName) : "S"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content ------------------------------------------------------ */}
      <main className="lg:ps-[264px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav -------------------------------------------------- */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex h-[76px] max-w-[480px] items-stretch justify-around px-2">
          {mobileItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors",
                  item.active
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.active && (
                  <span className="absolute top-1 h-1 w-8 rounded-full bg-secondary-500" />
                )}
                <Icon className={cn("h-5 w-5", item.active && "text-secondary-600 dark:text-secondary-500")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
