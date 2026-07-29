"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GraduationCap, Menu, X, CreditCard, Languages } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import { ThemeToggle } from "@/components/scholarship/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { useCredits } from "@/lib/credits-context"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scholarships", label: "Discover" },
  { href: "/dashboard/documents", label: "Documents" },
  { href: "/profile", label: "Profile" },
] as const

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { credits } = useCredits()
  const { language, isRTL, toggleLanguage } = useLanguage()
  const pathname = usePathname()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <header className={cn("sticky top-0 z-50 bg-primary/5 backdrop-blur-xl border-b border-primary/10", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">
              Scholarship
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">AI Finder</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" dir={isRTL ? "rtl" : "ltr"}>
          {navLinks.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all rounded-full",
                  active
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{credits}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hidden sm:flex rounded-full"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            <span className="ms-1.5 text-xs">{language === "en" ? "عربي" : "English"}</span>
          </Button>

          <ThemeToggle />

          <UserNav />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-border border-t bg-white/95 backdrop-blur-xl px-4 py-4 md:hidden" dir={isRTL ? "rtl" : "ltr"}>
          <div className="mx-auto max-w-7xl flex flex-col gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              )
            })}
            <div className="mt-3 flex items-center gap-2 border-border border-t pt-4">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{credits}</span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleLanguage} className="rounded-full">
                <Languages className="me-1.5 h-4 w-4" />
                {language === "en" ? "عربي" : "English"}
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
