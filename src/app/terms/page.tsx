"use client";

import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsPage() {
  const { pick, num } = useLanguage();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h2 font-bold text-foreground mb-8">{pick("شروط الخدمة", "Terms of Service")}</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong>{pick("آخر تحديث:", "Last updated:")}</strong> {pick("مايو", "May")} {num(2026)}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(1)}. {pick("قبول الشروط", "Acceptance of Terms")}
        </h2>
        <p>
          {pick(
            `باستخدامك ${BRAND.nameAr}، فإنك توافق على هذه الشروط. إذا لم توافق، فلا تستخدم الخدمة.`,
            `By using ${BRAND.name}, you agree to these terms. If you do not agree, do not use the service.`,
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(2)}. {pick("وصف الخدمة", "Description of Service")}
        </h2>
        <p>
          {pick(
            `يوفّر ${BRAND.nameAr} مطابقة مجانية للمنح مدعومة بالذكاء الاصطناعي، ومراجعة للمستندات، وخطط تقديم زمنية للطلاب. جميع المزايا الأساسية مجانية الاستخدام؛ ومراجعات المستندات تخضع لحد يومي.`,
            `${BRAND.name} provides free AI-powered scholarship matching, document review, and application roadmaps for students. All core features are free to use; document reviews are subject to a daily limit.`,
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(3)}. {pick("مسؤوليات المستخدم", "User Responsibilities")}
        </h2>
        <p>
          {pick(
            "أنت مسؤول عن تقديم معلومات دقيقة وعن ضمان امتثال استخدامك للمنصة لجميع القوانين السارية. لا يجوز لك رفع محتوى ضار أو محاولة إساءة استخدام نظام مراجعة الذكاء الاصطناعي.",
            "You are responsible for providing accurate information and ensuring your use of the platform complies with all applicable laws. You may not upload malicious content or attempt to abuse the AI review system.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(4)}. {pick("مراجعات الذكاء الاصطناعي", "AI Reviews")}
        </h2>
        <p>
          {pick(
            "تُقدَّم التغذية الراجعة الناتجة عن الذكاء الاصطناعي كإرشاد فقط، ولا تضمن قبولك في أي منحة. تعتمد المراجعات على الأنماط وأفضل الممارسات، وليس على معايير القبول الفعلية.",
            "AI-generated feedback is provided as guidance only and does not guarantee scholarship acceptance. Reviews are based on patterns and best practices, not on actual admissions criteria.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(5)}. {pick("حدود المسؤولية", "Limitation of Liability")}
        </h2>
        <p>
          {pick(
            `${BRAND.nameAr} غير مسؤول عن نتائج طلبات المنح. توفّر المنصة أدوات وإرشادات لكنها لا تضمن القبول أو التمويل.`,
            `${BRAND.name} is not responsible for scholarship application outcomes. The platform provides tools and guidance but does not guarantee admission or funding.`,
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(6)}. {pick("تغييرات على الشروط", "Changes to Terms")}
        </h2>
        <p>
          {pick(
            "قد نحدّث هذه الشروط في أي وقت. استمرارك في استخدام الخدمة بعد التعديلات يُعدّ موافقة على الشروط الجديدة.",
            "We may update these terms at any time. Continued use after changes constitutes acceptance of the new terms.",
          )}
        </p>
      </div>
    </main>
  );
}
