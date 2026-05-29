import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, GraduationCap, ExternalLink, ArrowLeft, Clock, Award, BookOpen, CheckCircle2, Building2, Target, Sparkles } from "lucide-react";

function formatDate(d: Date | null): string {
  if (!d) return "No deadline";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysLeft(deadline: Date | null): number | null {
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = { Japan: "🇯🇵", Hungary: "🇭🇺", "United Kingdom": "🇬🇧", "United States": "🇺🇸", Canada: "🇨🇦", Germany: "🇩🇪", Netherlands: "🇳🇱", Poland: "🇵🇱", France: "🇫🇷", Italy: "🇮🇹", China: "🇨🇳", Turkey: "🇹🇷", Russia: "🇷🇺", Australia: "🇦🇺" };
  return flags[country] ?? "🌍";
}

function tryParseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "");
}

export default async function ScholarshipDetailPage({ params }: { params: { id: string } }) {
  const scholarship = await prisma.scholarship.findUnique({ where: { id: params.id } });
  if (!scholarship) notFound();

  const benefits = tryParseJson(scholarship.benefits);
  const requirements = tryParseJson(scholarship.requirements);
  const daysLeft = getDaysLeft(scholarship.deadline);
  const isUrgent = daysLeft !== null && daysLeft <= 30;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-900">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md dark:bg-gray-900/90 dark:border-gray-700">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/scholarships">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{getCountryFlag(scholarship.country)}</span>
            <h1 className="truncate text-sm font-semibold text-foreground">{scholarship.nameEn}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero card */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="relative">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getCountryFlag(scholarship.country)}</span>
                <div>
                  <p className="text-sm font-medium text-white/70">{scholarship.country}{scholarship.university ? ` · ${scholarship.university}` : ""}</p>
                  <h1 className="text-h3 sm:text-h2 font-bold mt-1">{scholarship.nameEn}</h1>
                  {scholarship.nameAr && <p className="mt-1 text-lg text-white/70" dir="rtl">{scholarship.nameAr}</p>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 rounded-full px-3 py-1">
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                {scholarship.degree}
              </Badge>
              {isUrgent ? (
                <Badge className="bg-red-500 text-white rounded-full px-3 py-1">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {daysLeft} days left
                </Badge>
              ) : daysLeft !== null ? (
                <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 rounded-full px-3 py-1">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Due {formatDate(scholarship.deadline)}
                </Badge>
              ) : null}
              <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 rounded-full px-3 py-1">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                {scholarship.source ?? "Verified"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {scholarship.description && (
              <Card className="border border-slate-200 rounded-xl shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4 text-primary" />
                    About this Scholarship
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed dark:text-gray-300">{scholarship.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {requirements && (
              <Card className="border border-slate-200 rounded-xl shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonList data={requirements} />
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {benefits && (
              <Card className="border border-slate-200 rounded-xl shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-amber-500" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonList data={benefits} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="border border-slate-200 rounded-xl shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoGrid
                  rows={[
                    { label: "Country", value: scholarship.country, icon: MapPin },
                    { label: "University", value: scholarship.university ?? "Various", icon: Building2 },
                    { label: "Degree", value: scholarship.degree, icon: GraduationCap },
                    { label: "Deadline", value: formatDate(scholarship.deadline), icon: Calendar },
                    { label: "Source", value: scholarship.source ?? "Manual", icon: Sparkles },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Urgency Card */}
            {daysLeft !== null && (
              <Card className={`border rounded-xl shadow-sm ${isUrgent ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/20" : "border-slate-200 dark:border-gray-700 dark:bg-gray-800"}`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isUrgent ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" : "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isUrgent ? "text-red-800 dark:text-red-300" : "text-slate-600 dark:text-gray-300"}`}>Deadline</p>
                      <p className={`text-xl font-bold ${isUrgent ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-gray-100"}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : "Past due"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="space-y-3">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full gap-2 text-base shadow-lg shadow-primary/20">
                  <Target className="h-5 w-5" />
                  Check Your Eligibility
                </Button>
              </Link>
              <Link href="/scholarships">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Browse More Scholarships
                </Button>
              </Link>
              {scholarship.sourceUrl && (
                <a href={scholarship.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View official source
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoGrid({ rows }: { rows: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }[] }) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-gray-700">
      {rows.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 py-3 text-sm">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="ml-auto font-medium text-foreground text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function JsonList({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-gray-700">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="py-3 text-sm">
          <dt className="font-medium text-slate-700 capitalize mb-1 dark:text-gray-200">{key.replace(/_/g, " ")}</dt>
          <dd className="text-slate-600 dark:text-gray-300">
            {Array.isArray(value) ? (
              <ul className="space-y-1.5">
                {value.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{String(item)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span>{displayValue(value)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
