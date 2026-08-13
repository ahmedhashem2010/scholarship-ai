"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeadlineIndicator } from "@/components/ui/deadline-indicator";
import {
  Select,
  SelectItem,
} from "@/components/ui/select";
import {
  Search,
  GraduationCap,
  Building2,
  ArrowRight,
  Globe,
  SlidersHorizontal,
  RotateCcw,
  X,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { COMPARE_MAX_SELECTIONS, encodeCompareIds } from "@/lib/compare-ids";

interface ScholarshipCardData {
  id: string;
  nameEn: string;
  country: string;
  university: string | null;
  degree: string;
  deadline: string | null;
  competitionLevel: string;
  description: string | null;
  benefits: string | null;
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    Japan: "🇯🇵", Hungary: "🇭🇺", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
    Canada: "🇨🇦", Germany: "🇩🇪", Netherlands: "🇳🇱", Poland: "🇵🇱",
    France: "🇫🇷", Italy: "🇮🇹", China: "🇨🇳", Turkey: "🇹🇷",
    Russia: "🇷🇺", Australia: "🇦🇺", "Multiple (Europe)": "🇪🇺",
  };
  return flags[country] ?? "🌍";
}

function getCompetitionVariant(level: string): "red" | "yellow" | "green" | "gray" {
  switch (level) {
    case "high": return "red";
    case "medium": return "yellow";
    case "low": return "green";
    default: return "gray";
  }
}

function parseBenefitValue(benefits: string | null, key: string): string | null {
  if (!benefits) return null;
  try { const p = JSON.parse(benefits); return p[key] ?? null; } catch { return null; }
}

function degreeMatches(degree: string, targetDegree: string): boolean {
  if (!targetDegree) return true;
  const t = targetDegree.toUpperCase();
  return degree.toUpperCase().includes(t === "BACHELOR" ? "BACHELOR" : t === "MASTER" ? "MASTER" : t === "PHD" ? "PHD" : t);
}

export function ScholarshipCardList({ scholarships }: { scholarships: ScholarshipCardData[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [degreeFilter, setDegreeFilter] = useState("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline_asc");
  const [matchMyDegree, setMatchMyDegree] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { profile } = useProfile();
  const router = useRouter();

  const profileDegree = profile?.targetDegree ?? null;

  useEffect(() => {
    if (profileDegree) {
      setDegreeFilter(profileDegree);
      setMatchMyDegree(true);
    }
  }, [profileDegree]);

  const countries = useMemo(() => {
    const set = new Set(scholarships.map((s) => s.country));
    return Array.from(set).sort();
  }, [scholarships]);

  const filtered = useMemo(() => {
    let result = [...scholarships];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.nameEn.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.university?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.degree.toLowerCase().includes(q)
      );
    }

    if (countryFilter !== "all") {
      result = result.filter((s) => s.country === countryFilter);
    }

    if (degreeFilter !== "all") {
      result = result.filter((s) => degreeMatches(s.degree, degreeFilter));
    }

    if (competitionFilter !== "all") {
      result = result.filter((s) => s.competitionLevel === competitionFilter);
    }

    switch (sortBy) {
      case "deadline_asc":
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
      case "deadline_desc":
        result.sort((a, b) => {
          if (!a.deadline) return -1;
          if (!b.deadline) return 1;
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        });
        break;
      case "name_asc":
        result.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
        break;
      case "name_desc":
        result.sort((a, b) => b.nameEn.localeCompare(a.nameEn));
        break;
    }

    return result;
  }, [scholarships, search, countryFilter, degreeFilter, competitionFilter, sortBy]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < COMPARE_MAX_SELECTIONS) next.add(id);
    setSelected(next);
  }

  function resetFilters() {
    setSearch("");
    setCountryFilter("all");
    setDegreeFilter(profileDegree ?? "all");
    setCompetitionFilter("all");
    setSortBy("deadline_asc");
  }

  const activeFilterCount = [search, countryFilter !== "all", degreeFilter !== "all", competitionFilter !== "all", sortBy !== "deadline_asc"].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  function getCompetitionColor(level: string): string {
    switch (level) {
      case "high": return "bg-gradient-to-r from-rose-500 to-pink-500";
      case "medium": return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "low": return "bg-gradient-to-r from-emerald-500 to-teal-500";
      default: return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, country, university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-11 pe-10 h-12 rounded-xl border-primary/10 bg-card"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="gap-2 shrink-0 h-12 rounded-xl border-primary/10 hover:bg-primary/5 hover:border-primary/20"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ms-1 inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary text-white text-xs font-medium px-1">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-card to-primary/[0.02]">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Country
              </label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectItem key="all" value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> Degree
              </label>
              <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                <SelectItem key="all" value="all">All Degrees</SelectItem>
                <SelectItem key="Bachelor" value="Bachelor">Bachelor</SelectItem>
                <SelectItem key="Master" value="Master">Master</SelectItem>
                <SelectItem key="PhD" value="PhD">PhD</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Competition
              </label>
              <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
                <SelectItem key="all" value="all">All Levels</SelectItem>
                <SelectItem key="low" value="low">Low</SelectItem>
                <SelectItem key="medium" value="medium">Medium</SelectItem>
                <SelectItem key="high" value="high">High</SelectItem>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Sort by
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectItem key="deadline_asc" value="deadline_asc">Deadline (Soonest)</SelectItem>
                <SelectItem key="deadline_desc" value="deadline_desc">Deadline (Latest)</SelectItem>
                <SelectItem key="name_asc" value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem key="name_desc" value="name_desc">Name (Z-A)</SelectItem>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{scholarships.length}</span> scholarships
          </p>
          {profileDegree && matchMyDegree && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Matched to {profileDegree}
            </span>
          )}
        </div>
      </div>

      {/* Scholarship Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((sch, i) => (
          <Card
            key={sch.id}
            className="group relative overflow-hidden border border-primary/10 bg-gradient-to-br from-card to-primary/[0.02] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Competition Level Bar */}
            <div className={`h-1 w-full ${getCompetitionColor(sch.competitionLevel)}`} />
            
            {/* Decorative Corner */}
            <div className="absolute top-0 end-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />

            <CardHeader className="space-y-3 pb-2 relative">
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none">{getCountryFlag(sch.country)}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selected.has(sch.id)}
                      onChange={() => toggle(sch.id)}
                      className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">Compare</span>
                  </label>
                  <Badge variant={getCompetitionVariant(sch.competitionLevel)} className="text-[10px] uppercase tracking-wider">
                    {sch.competitionLevel}
                  </Badge>
                </div>
              </div>

              <CardTitle className={`text-base font-bold leading-snug ${selected.has(sch.id) ? "text-primary" : ""}`}>
                {sch.nameEn}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span>{sch.country}</span>
                </span>
                {sch.university && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span className="truncate max-w-[160px]">{sch.university}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span>{sch.degree}</span>
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pt-0 relative">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sch.description ?? "No description available."}
              </p>

              <DeadlineIndicator deadline={sch.deadline} />

              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const t = parseBenefitValue(sch.benefits, "tuition");
                  const a = parseBenefitValue(sch.benefits, "allowance");
                  const items = [t, a].filter(Boolean);
                  return items.slice(0, 2).map((b, i) => (
                    <Badge key={i} variant="green" className="text-[11px]">
                      {b}
                    </Badge>
                  ));
                })()}
              </div>
            </CardContent>

            <div className="border-t border-primary/10 px-6 py-3 bg-primary/[0.02]">
              <Link href={`/scholarships/${sch.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 group/btn rounded-xl border-primary/20 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                  View Details
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No scholarships found</h2>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search terms</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 gap-1.5 rounded-xl border-primary/20 hover:bg-primary/5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Compare Button */}
      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => router.push(`/dashboard/compare?ids=${encodeCompareIds(Array.from(selected))}`)}
            className="shadow-xl shadow-primary/20 rounded-xl px-6"
          >
            <Sparkles className="h-4 w-4 me-2" />
            Compare Selected ({selected.size})
          </Button>
        </div>
      )}
    </div>
  );
}
