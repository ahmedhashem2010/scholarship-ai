"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  GitCompareArrows,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Award,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/scholarships", label: "Browse Scholarships", icon: Search },
  { href: "/dashboard/compare", label: "Compare Tool", icon: GitCompareArrows },
  { href: "/pricing", label: "Get Credits", icon: Award },
  { href: "/help", label: "Help & FAQ", icon: HelpCircle },
  { href: "/success-stories", label: "Success Stories", icon: Award },
  { href: "/glossary", label: "Glossary", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/scholarships") || pathname.startsWith("/pricing");
  if (!isDashboard) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto dark:bg-gray-900 dark:border-gray-700",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              S
            </div>
            <span className="text-sm">ScholarshipAI</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden rounded-lg p-1 hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span>{item.label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 p-3">
            <p className="text-xs font-semibold text-primary-800">Need help?</p>
            <p className="text-[11px] text-primary-600 mt-0.5">Check our FAQ or contact support</p>
          </div>
        </div>
      </aside>
    </>
  );
}
