'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";

const terms = [
  {
    category: { ar: "الدراسة والدرجات", en: "Academics & Grades" },
    items: [
      {
        term: "GPA (Grade Point Average)",
        definition: {
          ar: "مقياس موحّد للأداء الأكاديمي، وعادة على مقياس ٤٫٠ في النظام الأمريكي. تشترط كثير من المنح حداً أدنى للمعدل التراكمي (مثل ٣٫٠ من ٤٫٠).",
          en: "A standardized measure of academic performance. Usually on a 4.0 scale in the US system. Many scholarships require a minimum GPA (e.g., 3.0/4.0).",
        },
      },
      {
        term: "CGPA (Cumulative GPA)",
        definition: {
          ar: "معدلك التراكمي الإجمالي عبر جميع الفصول والسنوات الدراسية. تنظر بعض المنح إلى المعدل التراكمي بدلاً من درجات كل فصل على حدة.",
          en: "Your overall GPA across all semesters/years of study. Some scholarships look at CGPA rather than semester-by-semester grades.",
        },
      },
      {
        term: "ECTS (European Credit Transfer System)",
        definition: {
          ar: "معيار تستخدمه الجامعات الأوروبية لقياس العبء الأكاديمي. ٦٠ ECTS = سنة دراسية كاملة. تستخدمه منح مثل ستيبينديوم هنغاريكم وإيراسموس.",
          en: "A standard used by European universities to measure academic workload. 60 ECTS = 1 full academic year. Used by scholarships like Stipendium Hungaricum and Erasmus.",
        },
      },
    ],
  },
  {
    category: { ar: "اختبارات اللغة", en: "Language Tests" },
    items: [
      {
        term: "TOEFL (Test of English as a Foreign Language)",
        definition: {
          ar: "اختبار إتقان اللغة الإنجليزية تقبله معظم الجامعات حول العالم. النتائج المطلوبة الشائعة: ٨٠-١٠٠ (عبر الإنترنت). صالح لمدة عامين.",
          en: "An English proficiency test accepted by most universities worldwide. Common required scores: 80-100 (internet-based). Valid for 2 years.",
        },
      },
      {
        term: "IELTS (International English Language Testing System)",
        definition: {
          ar: "اختبار إنجليزي آخر مقبول على نطاق واسع. تتراوح النتائج على مقياس من ١ إلى ٩. تتطلب معظم المنح نتيجة ٦٫٠-٧٫٠، ويُطلَب عادةً الإصدار الأكاديمي.",
          en: "Another widely accepted English test. Scores are on a 1-9 band scale. Most scholarships require 6.0-7.0. Academic version is usually required.",
        },
      },
      {
        term: "JLPT (Japanese Language Proficiency Test)",
        definition: {
          ar: "اختبار للغة اليابانية (N1-N5، حيث N1 الأعلى). مطلوب لبعض المنح اليابانية مثل MEXT إذا كانت الدراسة باللغة اليابانية.",
          en: "A test of Japanese language ability (N1-N5, where N1 is highest). Required for some Japanese scholarships like MEXT if the program is taught in Japanese.",
        },
      },
    ],
  },
  {
    category: { ar: "المستندات", en: "Documents" },
    items: [
      {
        term: "Recommendation Letter",
        definition: {
          ar: "رسالة من أستاذ أو جهة عمل أو مرشد تدعم طلبك. اختر من يعرف عملك جيداً، وامنحه من ٢ إلى ٣ أسابيع لكتابتها.",
          en: "A letter from a professor, employer, or mentor supporting your application. Choose someone who knows your work well. Give them 2-3 weeks to write it.",
        },
      },
      {
        term: "Research Proposal",
        definition: {
          ar: "خطة مفصّلة لمشروعك البحثي المقترح. مطلوب للمنح القائمة على البحث (MEXT وDAAD). يجب أن يتضمن: العنوان، الخلفية، المنهجية، الخطة الزمنية، والنتائج المتوقعة.",
          en: "A detailed plan of your intended research project. Required for research-based scholarships (MEXT, DAAD). Should include: title, background, methodology, timeline, expected outcomes.",
        },
      },
      {
        term: "Motivation Letter / Personal Statement",
        definition: {
          ar: "مقال يشرح لماذا تريد هذه المنحة ولماذا أنت مناسب لها. ركّز على قصتك وإنجازاتك وأهدافك المستقبلية. يتراوح طوله عادةً بين ٥٠٠ و١٠٠٠ كلمة.",
          en: "An essay explaining why you want this scholarship and why you're a good fit. Focus on your story, achievements, and future goals. Typically 500-1000 words.",
        },
      },
    ],
  },
  {
    category: { ar: "مصطلحات المنح", en: "Scholarship Terms" },
    items: [
      {
        term: "Stipend",
        definition: {
          ar: "دفعة منتظمة (شهرية أو سنوية) لتغطية نفقات المعيشة أثناء الدراسة. تختلف المبالغ حسب الدولة وبرنامج المنحة.",
          en: "A regular payment (monthly or yearly) to cover living expenses while studying. Amounts vary by country and scholarship program.",
        },
      },
      {
        term: "Tuition Waiver",
        definition: {
          ar: "تخفيض أو إلغاء الرسوم الدراسية. الإعفاء الكامل من الرسوم يعني ألا تدفع شيئاً مقابل المقررات، وتتضمنه معظم المنح التنافسية.",
          en: "A reduction or elimination of tuition fees. Full tuition waiver means you pay nothing for courses. Most competitive scholarships include this.",
        },
      },
      {
        term: "Full Scholarship",
        definition: {
          ar: "تغطي جميع النفقات الرئيسية: الرسوم الدراسية، تكاليف المعيشة، السكن، التأمين الصحي، وأحياناً السفر. أمثلة: MEXT وتشيفنينغ وستيبينديوم هنغاريكم.",
          en: "Covers all major expenses: tuition, living costs, accommodation, health insurance, and sometimes travel. Examples: MEXT, Chevening, Stipendium Hungaricum.",
        },
      },
      {
        term: "Bond / Service Requirement",
        definition: {
          ar: "التزام بالعودة إلى بلدك أو العمل لدى جهة محددة بعد التخرج. تشترط بعض المنح ذلك (مثل العودة إلى مصر لعامين بعد منحة MEXT).",
          en: "A commitment to return to your home country or work for a specific employer after graduation. Some scholarships require this (e.g., return to Egypt for 2 years after MEXT).",
        },
      },
    ],
  },
];

export default function GlossaryPage() {
  const { pick } = useLanguage();

  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{pick("مرجع", "Reference")}</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">{pick("قاموس مصطلحات المنح", "Scholarship Glossary")}</h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            {pick(
              "المصطلحات والاختصارات الشائعة المستخدمة في طلبات المنح",
              "Common terms and abbreviations used in scholarship applications"
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {terms.map((cat, ci) => (
          <section key={ci}>
            <h2 className="text-h3 mb-4">{pick(cat.category.ar, cat.category.en)}</h2>
            <div className="space-y-3">
              {cat.items.map((item, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm">{item.term}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pick(item.definition.ar, item.definition.en)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
        <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <h2 className="text-base font-semibold text-foreground mb-1">{pick("ألا تجد مصطلحاً؟", "Can't find a term?")}</h2>
        <p className="text-sm text-muted-foreground">
          {pick(
            "غير متأكد من معنى شيء ما؟ اكتب لنا على ",
            "Not sure what something means? Drop us a line at "
          )}
          <a href={`mailto:${BRAND.supportEmail}`} className="font-medium text-primary hover:underline" dir="ltr">
            {BRAND.supportEmail}
          </a>{" "}
          {pick("وسنوضحه لك.", "and we'll explain it.")}
        </p>
      </div>
    </div>
  );
}
