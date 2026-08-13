"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, GraduationCap, User, Globe, Briefcase } from "lucide-react";
import { ConversionEvents } from "@/lib/analytics";
import { useProfile } from "@/lib/profile-context";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { EnglishStep, type EnglishAnswers } from "@/components/onboarding/english-step";

const steps = [
  { titleAr: "عنك", titleEn: "About You", icon: User },
  { titleAr: "دراستك", titleEn: "Education", icon: GraduationCap },
  { titleAr: "خبرتك", titleEn: "Experience", icon: Briefcase },
  { titleAr: "التفضيلات", titleEn: "Preferences", icon: Globe },
  { titleAr: "مراجعة", titleEn: "Review", icon: Check },
];

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

const budgetOptions = [
  { value: "NONE", ar: "لا يتوفر تمويل", en: "No funding available" },
  { value: "LIMITED", ar: "محدود (أحتاج تمويلاً جزئياً)", en: "Limited (partial coverage needed)" },
  { value: "MODERATE", ar: "متوسط (أستطيع تغطية بعض التكاليف)", en: "Moderate (can cover some costs)" },
  { value: "FULL", ar: "كامل (أستطيع تمويل نفسي)", en: "Full (can self-fund)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { t, pick, num } = useLanguage();
  const { refresh: refreshProfile } = useProfile();
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
    hasEnglishTest: "" as EnglishAnswers["hasEnglishTest"],
    englishTestType: "",
    englishTestDate: "",
    testTimeframe: "",
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
      // The branch answer is what matters. A student who picked
      // "prefer scholarships without a test" has answered completely.
      case 3:
        if (!form.hasEnglishTest) return false;
        if (form.hasEnglishTest === "YES") return !!form.englishTestType && !!form.englishScore;
        if (form.hasEnglishTest === "WILLING") return !!form.testTimeframe;
        return true;
      default: return true;
    }
  }

  function nextStep() {
    if (canProceed()) setStep(Math.min(step + 1, steps.length - 1));
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  function optionLabel(value: string, options: { value: string; ar: string; en: string }[]): string {
    const o = options.find((x) => x.value === value);
    return o ? pick(o.ar, o.en) : value;
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
      hasEnglishTest: form.hasEnglishTest,
      englishTestType: form.englishTestType || null,
      englishTestDate: form.englishTestDate || null,
      testTimeframe: form.testTimeframe || null,
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
        await refreshProfile();
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(json.details ? Object.values(json.details).flat().join(". ") : (json.error ?? pick("فشل حفظ الملف الشخصي", "Failed to save profile")));
      }
    } catch {
      setError(pick("حدث خطأ ما. يرجى المحاولة مرة أخرى.", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">{pick("جارِ التحميل…", "Loading...")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-x-hidden">
      <div className="page-container py-8 sm:py-12 max-w-xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3 sm:mb-4">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h1 className="text-xl sm:text-h2">{pick("أنشئ ملفك الشخصي", "Set Up Your Profile")}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">{pick("ساعدنا في العثور على المنح المثالية لك", "Help us find the perfect scholarships for you")}</p>
        </div>

        {/* Step Indicator — Mobile */}
        <div className="md:hidden text-center mb-6">
          <p className="text-sm text-muted-foreground">
            {pick(`الخطوة ${num(step + 1)} من ${num(steps.length)}`, `Step ${step + 1} of ${steps.length}`)}
          </p>
          <h2 className="text-xl font-semibold mt-1">
            {steps[step] ? pick(steps[step].titleAr, steps[step].titleEn) : ""}
          </h2>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step Indicator — Desktop */}
        <div className="hidden md:block mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.titleEn} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                      i < step
                        ? "border-primary bg-primary text-primary-foreground"
                        : i === step
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                    {pick(s.titleAr, s.titleEn)}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-2 mb-6 h-0.5 w-12 sm:w-20 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="hidden sm:block">
              <h2 className="text-base font-semibold mb-4">{steps[step] ? pick(steps[step].titleAr, steps[step].titleEn) : ""}</h2>
            </div>
            {step === 0 && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("onb.fullName")}</label>
                  <input
                    value={form.displayName}
                    onChange={(e) => update("displayName", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={pick("أحمد حسن", "Ahmed Hassan")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("onb.dob")}</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("onb.country")}</label>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{pick("اختر بلدك…", "Select your country...")}</option>
                    {countries.map((c) => (
                      <option key={c.value} value={c.value}>{pick(c.ar, c.en)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("المستوى التعليمي الحالي", "Current Education Level")}</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {educationLevels.map((el) => (
                      <button
                        key={el.value}
                        type="button"
                        onClick={() => update("educationLevel", el.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-start text-sm font-medium transition ${
                          form.educationLevel === el.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-border text-muted-foreground hover:border-border"
                        }`}
                      >
                        {pick(el.ar, el.en)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("مجال الدراسة / التخصص", "Field of Study / Major")}</label>
                  <select
                    value={form.major}
                    onChange={(e) => update("major", e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{pick("اختر تخصصك…", "Select your major...")}</option>
                    {majors.map((m) => (
                      <option key={m.value} value={m.value}>{pick(m.ar, m.en)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("الدرجة المستهدفة", "Target Degree")}</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {targetDegrees.map((td) => (
                      <button
                        key={td.value}
                        type="button"
                        onClick={() => update("targetDegree", td.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition ${
                          form.targetDegree === td.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-border text-muted-foreground hover:border-border"
                        }`}
                      >
                        {pick(td.ar, td.en)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("المعدل التراكمي (اختياري)", "GPA (optional)")}</label>
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
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{pick("لدي خبرة عمل", "I have work experience")}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{pick("بما في ذلك التدريب والوظائف بدوام جزئي", "Include internships and part-time jobs")}</p>
                    </div>
                  </label>
                </div>
                {form.hasWorkExperience && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{pick("سنوات الخبرة", "Years of Experience")}</label>
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
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{pick("لدي خبرة بحثية", "I have research experience")}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{pick("منشورات، مشاريع بحثية، أو رسائل جامعية", "Publications, research projects, or thesis work")}</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <EnglishStep
                  value={{
                    hasEnglishTest: form.hasEnglishTest,
                    englishTestType: form.englishTestType,
                    englishScore: form.englishScore,
                    englishTestDate: form.englishTestDate,
                    testTimeframe: form.testTimeframe,
                    englishLevel: form.englishLevel,
                  }}
                  onChange={(patch) =>
                    setForm((f) => ({ ...f, ...patch }))
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{pick("الميزانية / التمويل", "Budget / Funding")}</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {budgetOptions.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => update("budget", b.value)}
                        className={`rounded-xl border-2 px-4 py-3 text-start text-sm font-medium transition ${
                          form.budget === b.value
                            ? "border-primary bg-primary-50 text-primary"
                            : "border-border text-muted-foreground hover:border-border"
                        }`}
                      >
                        {pick(b.ar, b.en)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-foreground">{pick("راجع ملفك الشخصي", "Review Your Profile")}</h2>
                <p className="text-sm text-muted-foreground">{pick("تأكد من أن كل شيء يبدو صحيحاً قبل الحفظ", "Make sure everything looks right before saving")}</p>
                <div className="space-y-3">
                  {[
                    { label: pick("الاسم", "Name"), value: form.displayName },
                    { label: pick("تاريخ الميلاد", "Date of Birth"), value: form.dateOfBirth },
                    { label: pick("البلد", "Country"), value: optionLabel(form.country, countries) },
                    { label: pick("المستوى التعليمي", "Education Level"), value: optionLabel(form.educationLevel, educationLevels) },
                    { label: pick("التخصص", "Major"), value: form.major ? optionLabel(form.major, majors) : pick("غير محدد", "Not specified") },
                    { label: pick("الدرجة المستهدفة", "Target Degree"), value: optionLabel(form.targetDegree, targetDegrees) },
                    { label: pick("المعدل التراكمي", "GPA"), value: form.gpa || pick("غير محدد", "Not specified") },
                    {
                      label: pick("الإنجليزية", "English"),
                      value:
                        form.hasEnglishTest === "YES"
                          ? pick(`${form.englishTestType} ${form.englishScore || "؟"}`, `${form.englishTestType} ${form.englishScore || "?"}`)
                          : form.hasEnglishTest === "WILLING"
                            ? pick(`سأخوض اختباراً (${form.testTimeframe || "؟"})`, `Will take a test (${form.testTimeframe || "?"})`)
                            : form.hasEnglishTest === "PREFER_WITHOUT"
                              ? pick("يفضّل منحاً لا تشترط اختبار إنجليزية", "Prefers no English test")
                              : "—",
                    },
                    { label: pick("الخبرة العملية", "Work Experience"), value: form.hasWorkExperience ? pick(`${num(form.workYears || "؟")} سنة`, `${form.workYears || "?"} years`) : pick("لا يوجد", "None") },
                    { label: pick("الخبرة البحثية", "Research Experience"), value: form.hasResearch ? pick("نعم", "Yes") : pick("لا", "No") },
                    { label: pick("الميزانية", "Budget"), value: form.budget ? optionLabel(form.budget, budgetOptions) : pick("غير محدد", "Not specified") },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between border-b border-border pb-2">
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("onb.back")}
              </Button>

              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-1.5"
                >
                  {t("onb.next")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-1.5"
                >
                  {loading ? pick("جارِ الحفظ…", "Saving...") : pick("إكمال الإعداد", "Complete Setup")}
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
