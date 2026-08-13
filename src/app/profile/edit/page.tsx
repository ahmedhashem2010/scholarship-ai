"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Save } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const countries = [
  { value: "Egypt", ar: "مصر", en: "Egypt" },
  { value: "Saudi Arabia", ar: "السعودية", en: "Saudi Arabia" },
  { value: "United Arab Emirates", ar: "الإمارات العربية المتحدة", en: "United Arab Emirates" },
  { value: "Qatar", ar: "قطر", en: "Qatar" },
  { value: "Kuwait", ar: "الكويت", en: "Kuwait" },
  { value: "Oman", ar: "عُمان", en: "Oman" },
  { value: "Bahrain", ar: "البحرين", en: "Bahrain" },
  { value: "Jordan", ar: "الأردن", en: "Jordan" },
  { value: "Lebanon", ar: "لبنان", en: "Lebanon" },
  { value: "Morocco", ar: "المغرب", en: "Morocco" },
  { value: "Algeria", ar: "الجزائر", en: "Algeria" },
  { value: "Tunisia", ar: "تونس", en: "Tunisia" },
  { value: "Palestine", ar: "فلسطين", en: "Palestine" },
  { value: "Syria", ar: "سوريا", en: "Syria" },
  { value: "Iraq", ar: "العراق", en: "Iraq" },
  { value: "Yemen", ar: "اليمن", en: "Yemen" },
  { value: "Sudan", ar: "السودان", en: "Sudan" },
  { value: "Libya", ar: "ليبيا", en: "Libya" },
];

const educationLevels = [
  { value: "high-school", ar: "الثانوية العامة", en: "High School" },
  { value: "bachelor", ar: "درجة البكالوريوس", en: "Bachelor's Degree" },
  { value: "master", ar: "درجة الماجستير", en: "Master's Degree" },
  { value: "phd", ar: "الدكتوراه", en: "PhD / Doctorate" },
];

const majors = [
  { value: "Computer Science", ar: "علوم الحاسوب", en: "Computer Science" },
  { value: "Engineering", ar: "الهندسة", en: "Engineering" },
  { value: "Medicine", ar: "الطب", en: "Medicine" },
  { value: "Business", ar: "إدارة الأعمال", en: "Business" },
  { value: "Law", ar: "القانون", en: "Law" },
  { value: "Economics", ar: "الاقتصاد", en: "Economics" },
  { value: "Biology", ar: "علم الأحياء", en: "Biology" },
  { value: "Physics", ar: "الفيزياء", en: "Physics" },
  { value: "Mathematics", ar: "الرياضيات", en: "Mathematics" },
  { value: "Chemistry", ar: "الكيمياء", en: "Chemistry" },
  { value: "Architecture", ar: "العمارة", en: "Architecture" },
  { value: "Education", ar: "التربية", en: "Education" },
  { value: "Arts", ar: "الفنون", en: "Arts" },
  { value: "Political Science", ar: "العلوم السياسية", en: "Political Science" },
  { value: "Environmental Science", ar: "العلوم البيئية", en: "Environmental Science" },
  { value: "Other", ar: "أخرى", en: "Other" },
];

const targetDegrees = [
  { value: "bachelor", ar: "بكالوريوس", en: "Bachelor's" },
  { value: "master", ar: "ماجستير", en: "Master's" },
  { value: "phd", ar: "دكتوراه", en: "PhD" },
  { value: "exchange", ar: "برنامج تبادل", en: "Exchange Program" },
  { value: "summer-school", ar: "مدرسة صيفية", en: "Summer School" },
];

const englishLevels = [
  { value: "beginner", ar: "مبتدئ", en: "Beginner" },
  { value: "intermediate", ar: "متوسط", en: "Intermediate" },
  { value: "advanced", ar: "متقدم", en: "Advanced" },
  { value: "fluent", ar: "طليق", en: "Fluent" },
  { value: "native", ar: "اللغة الأم", en: "Native" },
  { value: "TOEFL", ar: "TOEFL", en: "TOEFL" },
  { value: "IELTS", ar: "IELTS", en: "IELTS" },
];

const budgetOptions = [
  { value: "NONE", ar: "لا يتوفر تمويل", en: "No funding available" },
  { value: "LIMITED", ar: "محدود (أحتاج تمويلاً جزئياً)", en: "Limited (partial coverage needed)" },
  { value: "MODERATE", ar: "متوسط (أستطيع تغطية بعض التكاليف)", en: "Moderate (can cover some costs)" },
  { value: "FULL", ar: "كامل (أستطيع تمويل نفسي)", en: "Full (can self-fund)" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { t, pick } = useLanguage();
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
      .catch(() => setError(pick("فشل تحميل الملف الشخصي", "Failed to load profile")))
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
      ...(form.englishScore ? { englishScore: parseFloat(form.englishScore) } : {}),
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
        setError(json.error ?? pick("فشل الحفظ", "Failed to save"));
      }
    } catch {
      setError(pick("حدث خطأ ما", "Something went wrong"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container py-16 text-center">
        <div className="text-muted-foreground animate-pulse">{pick("جارِ تحميل الملف الشخصي…", "Loading profile...")}</div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
        <h1 className="text-h2">{pick("تعديل الملف الشخصي", "Edit Profile")}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{pick("المعلومات الشخصية", "Personal Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t("onb.fullName")}</label>
                <input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t("onb.dob")}</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{pick("البلد", "Country")}</label>
              <select value={form.country} onChange={(e) => update("country", e.target.value)} required
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">{pick("اختر…", "Select...")}</option>
                {countries.map((c) => <option key={c.value} value={c.value}>{pick(c.ar, c.en)}</option>)}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{pick("المستوى التعليمي", "Education Level")}</label>
                <select value={form.educationLevel} onChange={(e) => update("educationLevel", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{pick("اختر…", "Select...")}</option>
                  {educationLevels.map((el) => <option key={el.value} value={el.value}>{pick(el.ar, el.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{pick("مجال الدراسة", "Field of Study")}</label>
                <select value={form.major} onChange={(e) => update("major", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{pick("اختر…", "Select...")}</option>
                  {majors.map((m) => <option key={m.value} value={m.value}>{pick(m.ar, m.en)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{pick("الدرجة المستهدفة", "Target Degree")}</label>
                <select value={form.targetDegree} onChange={(e) => update("targetDegree", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{pick("اختر…", "Select...")}</option>
                  {targetDegrees.map((td) => <option key={td.value} value={td.value}>{pick(td.ar, td.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{pick("المعدل التراكمي (اختياري)", "GPA (optional)")}</label>
                <input type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={(e) => update("gpa", e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="3.5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{pick("مستوى الإنجليزية", "English Level")}</label>
                <select value={form.englishLevel} onChange={(e) => update("englishLevel", e.target.value)} required
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{pick("اختر…", "Select...")}</option>
                  {englishLevels.map((el) => <option key={el.value} value={el.value}>{pick(el.ar, el.en)}</option>)}
                </select>
              </div>
              {(form.englishLevel === "TOEFL" || form.englishLevel === "IELTS") && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {pick(form.englishLevel === "TOEFL" ? "درجة TOEFL (0-120)" : "درجة IELTS (0-9)", form.englishLevel === "TOEFL" ? "TOEFL Score (0-120)" : "IELTS Score (0-9)")}
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
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">{pick("الخبرة العملية", "Work Experience")}</span>
                  <p className="text-xs text-muted-foreground">{pick("بما في ذلك التدريب والوظائف بدوام جزئي", "Include internships and part-time jobs")}</p>
                </div>
              </label>
              {form.hasWorkExperience && (
                <div className="ms-7 mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("السنوات", "Years")}</label>
                  <input type="number" min={0} max={50} value={form.workYears} onChange={(e) => update("workYears", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring max-w-[120px]" />
                </div>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.hasResearch} onChange={(e) => update("hasResearch", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">{pick("الخبرة البحثية", "Research Experience")}</span>
                  <p className="text-xs text-muted-foreground">{pick("منشورات، مشاريع بحثية، أو رسائل جامعية", "Publications, research projects, or thesis work")}</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{pick("الميزانية / التمويل", "Budget / Funding")}</label>
              <select value={form.budget} onChange={(e) => update("budget", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">{pick("اختر…", "Select...")}</option>
                {budgetOptions.map((b) => <option key={b.value} value={b.value}>{pick(b.ar, b.en)}</option>)}
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
            )}
            {success && (
              <div className="rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {pick("تم حفظ الملف الشخصي! جارِ التحويل…", "Profile saved! Redirecting...")}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" />
                {saving ? pick("جارِ الحفظ…", "Saving...") : pick("حفظ التغييرات", "Save Changes")}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">{pick("إلغاء", "Cancel")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
