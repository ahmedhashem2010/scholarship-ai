"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  { href: "/scholarships", label: "Scholarships" },
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
    <header className={cn("sticky top-0 z-50 border-border border-b bg-card/80 backdrop-blur-sm", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-poppins)' }}>
            Scholarship<span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" dir={isRTL ? "rtl" : "ltr"}>
          {navLinks.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="secondary" className="hidden sm:flex gap-1.5 px-3 py-1">
            <CreditCard className="h-3.5 w-3.5" />
            <span>{credits} credits</span>
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hidden sm:flex"
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            <span className="ml-1.5 text-xs">{language === "en" ? "عربي" : "English"}</span>
          </Button>

          <ThemeToggle />

          <UserNav />

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-border border-t bg-card px-4 py-4 md:hidden" dir={isRTL ? "rtl" : "ltr"}>
          <div className="mx-auto max-w-7xl flex flex-col gap-1">
            {navLinks.map(({ href, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              )
            })}
            <div className="mt-3 flex items-center gap-2 border-border border-t pt-4">
              <Badge variant="secondary" className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{credits} credits</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={toggleLanguage}>
                <Languages className="mr-1.5 h-4 w-4" />
                {language === "en" ? "عربي" : "English"}
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
