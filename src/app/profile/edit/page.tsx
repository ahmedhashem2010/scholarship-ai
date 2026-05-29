"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const countries = [
  "Egypt", "Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait",
  "Oman", "Bahrain", "Jordan", "Lebanon", "Morocco", "Algeria", "Tunisia",
  "Palestine", "Syria", "Iraq", "Yemen", "Sudan", "Libya",
];

const educationLevels = [
  { value: "high-school", label: "High School" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD / Doctorate" },
];

const majors = [
  "Computer Science", "Engineering", "Medicine", "Business",
  "Law", "Economics", "Biology", "Physics", "Mathematics",
  "Chemistry", "Architecture", "Education", "Arts", "Political Science",
  "Environmental Science", "Other",
];

const targetDegrees = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "exchange", label: "Exchange Program" },
  { value: "summer-school", label: "Summer School" },
];

const englishLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "IELTS", label: "IELTS" },
];

const budgetOptions = [
  { value: "NONE", label: "No funding available" },
  { value: "LIMITED", label: "Limited (partial coverage needed)" },
  { value: "MODERATE", label: "Moderate (can cover some costs)" },
  { value: "FULL", label: "Full (can self-fund)" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    dateOfBirth: "",
    country: "",
    educationLevel: "",
    major: "",
    targetDegree: "",
    englishLevel: "",
    englishScore: "",
    gpa: "",
    hasWorkExperience: false,
    workYears: "",
    hasResearch: false,
    budget: "",
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const p = json.data;
          setForm({
            displayName: p.displayName ?? "",
            dateOfBirth: p.dateOfBirth ?? "",
            country: p.country ?? "",
            educationLevel: p.educationLevel ?? "",
            major: p.major ?? "",
            targetDegree: p.targetDegree ?? "",
            englishLevel: p.englishLevel ?? "",
            englishScore: p.englishScore?.toString() ?? "",
            gpa: p.gpa?.toString() ?? "",
            hasWorkExperience: p.hasWorkExperience ?? false,
            workYears: p.workYears?.toString() ?? "",
            hasResearch: p.hasResearch ?? false,
            budget: p.budget ?? "",
          });
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const body: Record<string, unknown> = {
      displayName: form.displayName,
      dateOfBirth: form.dateOfBirth,
      country: form.country,
      educationLevel: form.educationLevel,
      major: form.major || null,
      targetDegree: form.targetDegree,
      englishLevel: form.englishLevel,
      ...(form.englishScore ? { englishScore: parseInt(form.englishScore) } : {}),
      ...(form.gpa ? { gpa: parseFloat(form.gpa) } : {}),
      hasWorkExperience: form.hasWorkExperience,
      ...(form.hasWorkExperience && form.workYears ? { workYears: parseInt(form.workYears) } : {}),
      hasResearch: form.hasResearch,
      ...(form.budget ? { budget: form.budget } : {}),
    };

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setError(json.error ?? "Failed to save");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container py-16 text-center">
        <div className="text-muted-foreground animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-h2">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
              <select value={form.country} onChange={(e) => update("country", e.target.value)} required
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Education Level</label>
                <select value={form.educationLevel} onChange={(e) => update("educationLevel", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {educationLevels.map((el) => <option key={el.value} value={el.value}>{el.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Field of Study</label>
                <select value={form.major} onChange={(e) => update("major", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {majors.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Target Degree</label>
                <select value={form.targetDegree} onChange={(e) => update("targetDegree", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {targetDegrees.map((td) => <option key={td.value} value={td.value}>{td.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">GPA (optional)</label>
                <input type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={(e) => update("gpa", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="3.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">English Level</label>
                <select value={form.englishLevel} onChange={(e) => update("englishLevel", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {englishLevels.map((el) => <option key={el.value} value={el.value}>{el.label}</option>)}
                </select>
              </div>
              {(form.englishLevel === "TOEFL" || form.englishLevel === "IELTS") && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {form.englishLevel === "TOEFL" ? "TOEFL Score (0-120)" : "IELTS Score (0-9)"}
                  </label>
                  <input type="number" min={0} max={form.englishLevel === "TOEFL" ? 120 : 9} step={form.englishLevel === "IELTS" ? "0.5" : "1"}
                    value={form.englishScore} onChange={(e) => update("englishScore", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={form.englishLevel === "TOEFL" ? "100" : "6.5"} />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="flex items-start gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.hasWorkExperience} onChange={(e) => update("hasWorkExperience", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">Work Experience</span>
                  <p className="text-xs text-muted-foreground">Include internships and part-time jobs</p>
                </div>
              </label>
              {form.hasWorkExperience && (
                <div className="ml-7 mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Years</label>
                  <input type="number" min={0} max={50} value={form.workYears} onChange={(e) => update("workYears", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring max-w-[120px]" />
                </div>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.hasResearch} onChange={(e) => update("hasResearch", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">Research Experience</span>
                  <p className="text-xs text-muted-foreground">Publications, research projects, or thesis work</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Budget / Funding</label>
              <select value={form.budget} onChange={(e) => update("budget", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {budgetOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
            )}
            {success && (
              <div className="rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Profile saved! Redirecting...
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
