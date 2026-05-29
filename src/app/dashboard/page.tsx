"use client"

import { useState, useEffect, memo, useRef } from "react"
import { Header } from "@/components/scholarship/header"
import { useLanguage } from "@/contexts/LanguageContext"
import { useProfile } from "@/lib/profile-context"
import { DocumentProgress } from "@/components/DocumentProgress"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Upload,
  Search,
  Clock,
  ArrowRight,
  GraduationCap,
  Globe,
  TrendingUp,
  Sparkles,
  BookOpen,
  Award,
  User,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Scholarship {
  id: string
  name: string
  country: string
  flag: string
  deadline: string
  daysLeft: number
  fitScore: number
  amount: string
  field: string
  status: string
}

interface Document {
  id: string
  name: string
  score: number
  lastUpdated: string
  versions: number
}

const ScholarshipCard = memo(function ScholarshipCard({ scholarship, rank }: { scholarship: Scholarship; rank: number }) {
  return (
    <Link href={`/scholarships/${scholarship.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
        <div className="mb-3 flex items-start justify-between">
          <Badge variant="outline" className="text-xs">
            {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`} Match
          </Badge>
          <span className="text-xs text-muted-foreground">{scholarship.field}</span>
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground group-hover:text-primary">{scholarship.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{scholarship.flag} {scholarship.country}</p>
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{scholarship.deadline}</span>
          <span className={scholarship.daysLeft <= 30 ? "font-medium text-orange-500" : "text-muted-foreground"}>
            {scholarship.daysLeft <= 0 ? "Overdue" : `${scholarship.daysLeft}d left`}
          </span>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Match Score</span>
          <span className="font-bold text-primary">{scholarship.fitScore}%</span>
        </div>
        <Progress value={scholarship.fitScore} className="h-1.5" />
      </div>
    </Link>
  )
})

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    "United States": "🇺🇸", "United Kingdom": "🇬🇧", Germany: "🇩🇪", France: "🇫🇷",
    Japan: "🇯🇵", Canada: "🇨🇦", Australia: "🇦🇺", Netherlands: "🇳🇱",
    Sweden: "🇸🇪", Denmark: "🇩🇰", Norway: "🇳🇴", Italy: "🇮🇹",
    Spain: "🇪🇸", Switzerland: "🇨🇭", Belgium: "🇧🇪", Austria: "🇦🇹",
    "South Korea": "🇰🇷", China: "🇨🇳", Singapore: "🇸🇬", Hungary: "🇭🇺",
    Poland: "🇵🇱", "Czech Republic": "🇨🇿", Ireland: "🇮🇪", Finland: "🇫🇮",
    "New Zealand": "🇳🇿", "European Union": "🇪🇺", Turkey: "🇹🇷",
    Malaysia: "🇲🇾", "Saudi Arabia": "🇸🇦", "United Arab Emirates": "🇦🇪",
  }
  return flags[country] || "🌍"
}

export default function DashboardPage() {
  const router = useRouter()
  const { isRTL } = useLanguage()
  const { profile, isLoading: profileLoading } = useProfile()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const redirectingRef = useRef(false)

  useEffect(() => {
    if (profileLoading) return;
    if (!profile?.displayName) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
      return;
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (!profile?.displayName) return;
    async function fetchData() {
      try {
        const [docRes, scholRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/scholarships/match"),
        ])
        const docJson = await docRes.json()
        const scholJson = await scholRes.json()

        if (docJson.success) {
          setDocuments((docJson.data || []).map((d: any, i: number) => ({
            id: d.id,
            name: d.documentType || `Document ${i + 1}`,
            score: d.reviews?.[0]?.score || 0,
            lastUpdated: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Recently",
            versions: d._count?.childVersions || 1,
          })))
        }

        if (scholJson.success) {
          setScholarships((scholJson.data || []).slice(0, 4).map((m: any) => {
            const s = m.scholarship;
            let amount = "Varies";
            try { const b = JSON.parse(s.benefits); amount = b.tuition || b.allowance || "Varies"; } catch {}
            return {
              id: s.id,
              name: s.nameEn,
              country: s.country,
              flag: getCountryFlag(s.country),
              deadline: s.deadline ? new Date(s.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "TBD",
              daysLeft: s.deadline ? Math.ceil((new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999,
              fitScore: m.fitScore,
              amount,
              field: Array.isArray(s.fieldOfStudy) ? s.fieldOfStudy.join(", ") : "All Fields",
              status: "new",
            };
          }))
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [profile])

  if (loading) {
    return (
      <div className={cn("min-h-screen bg-background", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-10 w-72 rounded-lg bg-muted" />
              <div className="h-5 w-56 rounded-lg bg-muted" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-7 w-56 rounded-lg bg-muted" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-52 rounded-2xl bg-muted" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const stats = [
    { icon: BookOpen, label: "Active Scholarships", value: scholarships.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    { icon: Award, label: "Documents Ready", value: documents.filter(d => d.score >= 6).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    { icon: TrendingUp, label: "Avg Score", value: documents.length > 0 ? Math.round(documents.reduce((a, d) => a + d.score, 0) / documents.length) : "--", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950" },
    { icon: Clock, label: "Upcoming Deadlines", value: scholarships.filter(s => s.daysLeft <= 30).length, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950" },
  ]

  const quickActions = [
    { icon: Upload, label: "Upload Document", href: "/dashboard/documents", desc: "Get AI feedback" },
    { icon: Search, label: "Browse Scholarships", href: "/scholarships", desc: "Find opportunities" },
    { icon: Sparkles, label: "AI Writing Help", href: "/dashboard/reviews", desc: "Draft assistance" },
    { icon: Globe, label: "Country Guides", href: "/help", desc: "Study abroad tips" },
  ]

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Welcome back!
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    Your Top {scholarships.length || 5} Scholarships are ready
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-primary to-primary/40" />
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="group block">
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.03] hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary/15">
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Matched Scholarships & Documents Sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Your Top Matches
              </h2>
              <Link href="/scholarships" className="text-sm font-medium text-primary hover:underline">
                View All <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </div>
            {scholarships.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {scholarships.slice(0, 4).map((s, i) => (
                  <ScholarshipCard key={s.id} scholarship={s} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
                <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Complete your profile to get matched</p>
                <Link href="/onboarding" className="mt-4 inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-primary-foreground transition-all hover:bg-primary/80">
                  Complete Profile
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <DocumentProgress />
          </div>
        </div>
      </main>
    </div>
  )
}
