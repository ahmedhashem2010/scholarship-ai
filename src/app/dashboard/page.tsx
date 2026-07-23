"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, memo, useRef } from "react"
import { Header } from "@/components/scholarship/header"
import { useLanguage } from "@/contexts/LanguageContext"
import { useProfile } from "@/lib/profile-context"
import { DocumentProgress } from "@/components/DocumentProgress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Upload,
  Search,
  Clock,
  ArrowRight,
  GraduationCap,
  Globe,
  Sparkles,
  Award,
  Zap,
  Target,
  ChevronRight,
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
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-card to-primary/[0.02] p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
        <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : ""}</span>
              <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
                {scholarship.fitScore}% Match
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{scholarship.field}</span>
          </div>
          <h3 className="mb-1.5 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{scholarship.name}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{scholarship.flag} {scholarship.country}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {scholarship.deadline}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              scholarship.daysLeft <= 30 
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" 
                : "bg-primary/10 text-primary"
            )}>
              {scholarship.daysLeft <= 0 ? "Overdue" : `${scholarship.daysLeft}d left`}
            </span>
          </div>
        </div>
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
    { icon: Target, label: "Scholarships", value: scholarships.length, color: "text-primary", bg: "bg-primary/10", accent: "from-primary/20 to-primary/5" },
    { icon: Award, label: "Ready Docs", value: documents.filter(d => d.score >= 6).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950", accent: "from-emerald-200 to-emerald-50 dark:from-emerald-900 dark:to-emerald-950" },
    { icon: Zap, label: "Avg Score", value: documents.length > 0 ? Math.round(documents.reduce((a, d) => a + d.score, 0) / documents.length) : "--", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950", accent: "from-amber-200 to-amber-50 dark:from-amber-900 dark:to-amber-950" },
    { icon: Clock, label: "Urgent", value: scholarships.filter(s => s.daysLeft <= 30).length, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-950", accent: "from-rose-200 to-rose-50 dark:from-rose-900 dark:to-rose-950" },
  ]

  const quickActions = [
    { icon: Upload, label: "Upload", href: "/dashboard/documents", desc: "Get AI review", gradient: "from-primary/20 to-primary/5" },
    { icon: Search, label: "Discover", href: "/scholarships", desc: "Find matches", gradient: "from-emerald-200 to-emerald-50 dark:from-emerald-900 dark:to-emerald-950" },
    { icon: Sparkles, label: "AI Writer", href: "/dashboard/reviews", desc: "Draft help", gradient: "from-amber-200 to-amber-50 dark:from-amber-900 dark:to-amber-950" },
    { icon: Globe, label: "Guides", href: "/help", desc: "Study abroad", gradient: "from-violet-200 to-violet-50 dark:from-violet-900 dark:to-violet-950" },
  ]

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-emerald-600 p-8 sm:p-10 text-white shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-40" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Welcome back!
                  </h1>
                  <p className="mt-0.5 text-white/80">
                    Your Top {scholarships.length || 5} Scholarships are ready
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">{scholarships.length} matches found</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">{documents.length} documents</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                `hover:shadow-${stat.color.replace('text-', '')}/10`
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", stat.accent)} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg, stat.color)}>
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
              <div className={cn(
                "relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30",
              )}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-50 transition-opacity", action.gradient)} />
                <div className="relative">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
                  <ChevronRight className="mx-auto mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
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
              <Link href="/scholarships" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline group">
                View All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {scholarships.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {scholarships.slice(0, 4).map((s, i) => (
                  <ScholarshipCard key={s.id} scholarship={s} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-10 text-center">
                <GraduationCap className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Complete your profile to get matched</p>
                <Link href="/onboarding" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20">
                  Complete Profile <ArrowRight className="h-4 w-4" />
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
