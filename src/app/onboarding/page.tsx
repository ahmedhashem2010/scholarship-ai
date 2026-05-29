"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, GraduationCap, User, Globe, Briefcase } from "lucide-react";
import { ConversionEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { title: "About You", icon: User },
  { title: "Education", icon: GraduationCap },
  { title: "Experience", icon: Briefcase },
  { title: "Preferences", icon: Globe },
  { title: "Review", icon: Check },
];

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
  { value: "beginner", label: "Beginner", desc: "Basic understanding" },
  { value: "intermediate", label: "Intermediate", desc: "Can read and write" },
  { value: "advanced", label: "Advanced", desc: "Good academic English" },
  { value: "fluent", label: "Fluent", desc: "Confident in all situations" },
  { value: "native", label: "Native", desc: "Native speaker" },
  { value: "TOEFL", label: "TOEFL", desc: "Test score available" },
  { value: "IELTS", label: "IELTS", desc: "Test score available" },
];

const budgetOptions = [
  { value: "NONE", label: "No funding available" },
  { value: "LIMITED", label: "Limited (partial coverage needed)" },
  { value: "MODERATE", label: "Moderate (can cover some costs)" },
  { value: "FULL", label: "Full (can self-fund)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setErrors = useState<Record<string, string>>({})[1];
  const [checking, setChecking] = useState(true);

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
        if (json.success && json.data?.displayName && json.data?.dateOfBirth) {
          router.push("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!form.displayName && !!form.dateOfBirth && !!form.country;
      case 1: return !!form.educationLevel && !!form.targetDegree;
      case 2: return true;
      case 3: return !!form.englishLevel;
      default: return true;
    }
  }

  function nextStep() {
    if (canProceed()) setStep(Math.min(step + 1, steps.length - 1));
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  function getLabel(value: string, options: { value: string; label: string }[]): string {
    return options.find((o) => o.value === value)?.label ?? value;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      displayName: form.displayName,
      dateOfBirth: form.dateOfBirth,
      country: form.country,
      educationLevel: form.educationLevel,
      major: form.major || null,
      targetDegree: form.targetDegree,
      englishLevel: form.englishLevel,
      ...(form.englishScore ? { englishScore: form.englishScore } : {}),
      ...(form.gpa ? { gpa: form.gpa } : {}),
      hasWorkExperience: form.hasWorkExperience,
      ...(form.hasWorkExperience && form.workYears ? { workYears: form.workYears } : {}),
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
        ConversionEvents.onboardingComplete();
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(json.details ? Object.values(json.details).flat().join(". ") : (json.error ?? "Failed to save profile"));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-primary-50 to-white">
      <div className="page-container py-12 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-h2">Set Up Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Help us find the perfect scholarships for you</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                      i < step
                        ? "border-primary bg-primary text-primary-foreground"
                        : i === step
                        ? "border-primary text-primary"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium ${i <= step ? "text-primary" : "text-slate-400"}`}>
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-2 mb-6 h-0.5 w-12 sm:w-20 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{steps[step]?.title ?? ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input
                    value={form.displayName}
                    onChange={(e) => update("displayName", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ahmed Hassan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select your country...</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Current Education Level</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {educationLevels.map((el) => (
                      <button
                        key={el.value}
                        type="button"
                        onClick={() => update("educationLevel", el.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                          form.educationLevel === el.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-slate-200 text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        {el.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Field of Study / Major</label>
                  <select
                    value={form.major}
                    onChange={(e) => update("major", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select your major...</option>
                    {majors.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target Degree</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {targetDegrees.map((td) => (
                      <button
                        key={td.value}
                        type="button"
                        onClick={() => update("targetDegree", td.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition ${
                          form.targetDegree === td.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-slate-200 text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        {td.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">GPA (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={form.gpa}
                    onChange={(e) => update("gpa", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="3.5"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasWorkExperience}
                      onChange={(e) => update("hasWorkExperience", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">I have work experience</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Include internships and part-time jobs</p>
                    </div>
                  </label>
                </div>
                {form.hasWorkExperience && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Years of Experience</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={form.workYears}
                      onChange={(e) => update("workYears", e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="2"
                    />
                  </div>
                )}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasResearch}
                      onChange={(e) => update("hasResearch", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">I have research experience</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Publications, research projects, or thesis work</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">English Level</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {englishLevels.map((el) => (
                      <button
                        key={el.value}
                        type="button"
                        onClick={() => update("englishLevel", el.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                          form.englishLevel === el.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-slate-200 text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{el.label}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{el.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {(form.englishLevel === "TOEFL" || form.englishLevel === "IELTS") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {form.englishLevel === "TOEFL" ? "TOEFL Score (0-120)" : "IELTS Score (0-9)"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={form.englishLevel === "TOEFL" ? 120 : 9}
                      step={form.englishLevel === "IELTS" ? "0.5" : "1"}
                      value={form.englishScore}
                      onChange={(e) => update("englishScore", e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={form.englishLevel === "TOEFL" ? "100" : "6.5"}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Budget / Funding</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {budgetOptions.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => update("budget", b.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                          form.budget === b.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-slate-200 text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-foreground">Review Your Profile</h2>
                <p className="text-sm text-muted-foreground">Make sure everything looks right before saving</p>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: form.displayName },
                    { label: "Date of Birth", value: form.dateOfBirth },
                    { label: "Country", value: form.country },
                    { label: "Education Level", value: getLabel(form.educationLevel, educationLevels) },
                    { label: "Major", value: form.major || "Not specified" },
                    { label: "Target Degree", value: getLabel(form.targetDegree, targetDegrees) },
                    { label: "GPA", value: form.gpa || "Not specified" },
                    { label: "English Level", value: form.englishLevel === "TOEFL" || form.englishLevel === "IELTS" ? `${form.englishLevel} (${form.englishScore || "?"})` : getLabel(form.englishLevel, englishLevels) },
                    { label: "Work Experience", value: form.hasWorkExperience ? `${form.workYears || "?"} years` : "None" },
                    { label: "Research Experience", value: form.hasResearch ? "Yes" : "No" },
                    { label: "Budget", value: getLabel(form.budget, budgetOptions) || "Not specified" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-1.5"
                >
                  {loading ? "Saving..." : "Complete Setup"}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
