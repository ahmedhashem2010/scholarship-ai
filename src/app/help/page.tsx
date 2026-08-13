"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Search, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";

const faqs = [
  {
    id: "getting-started",
    category: { ar: "البدء", en: "Getting Started" },
    items: [
      {
        q: {
          ar: "كيف تعمل خوارزمية المطابقة؟",
          en: "How does the matching algorithm work?",
        },
        a: {
          ar: "تحلل خوارزميتنا ملفك الشخصي (الدراسة، التخصص، الدولة، مستوى الإنجليزية، العمر) وتقارنه بمتطلبات كل منحة، ثم تحسب درجة تطابق من ٠ إلى ١٠٠ بناءً على مدى انطباق شروطها عليك. النتيجة فوق ٧٠٪ تعني أنك مرشح قوي.",
          en: "Our algorithm analyzes your profile (education, major, country, English level, age) and compares it against each scholarship's requirements. It calculates a Fit Score from 0-100 based on how well you match. Scores above 70% mean you're a strong candidate.",
        },
      },
      {
        q: { ar: "كيف أنشئ ملفاً شخصياً قوياً؟", en: "How do I create a strong profile?" },
        a: {
          ar: "املأ كل الحقول في نموذج الإعداد بدقة، واذكر تخصصك ومستواك التعليمي ومستوى إجادتك للإنجليزية بدقة. كلما كان ملفك أدق، كانت نتائج المطابقة أفضل. يمكنك تحديث ملفك في أي وقت من إعدادات لوحتك.",
          en: "Fill out every field in the onboarding form accurately. Include your exact major, education level, and English proficiency. The more accurate your profile, the better your matches will be. You can always update your profile from the dashboard settings.",
        },
      },
      {
        q: { ar: "كم منحة ينبغي أن أتقدم إليها؟", en: "How many scholarships should I apply to?" },
        a: {
          ar: "ننصح بالتقدم إلى ٢-٤ منح. ركّز على منحة أو منحتين تكون نسبة تطابقك فيهما ٨٠٪ أو أكثر، ومنحة أو منحتين تنطبق عليك جميع شروطهما. الجودة أهم من الكمية — طلب قوي لعدد أقل من المنح أفضل من طلبات ضعيفة لكثير منها.",
          en: "We recommend applying to 2-4 scholarships. Focus on 1-2 where your fit score is 80%+, and 1-2 where you meet all requirements. Quality beats quantity — a strong application to fewer scholarships is better than weak applications to many.",
        },
      },
    ],
  },
  {
    id: "documents",
    category: { ar: "المستندات", en: "Documents" },
    items: [
      {
        q: { ar: "ما الذي يجعل خطاب الدوافع جيداً؟", en: "What makes a good personal statement?" },
        a: {
          ar: "خطاب الدوافع القوي يحكي قصتك أنت. ابدأ بإنجاز محدد أو لحظة أشعلت شغفك، وأظهر أثراً قابلاً للقياس (استخدم الأرقام). اربط تجربتك بوضوح بسبب اختيار هذا البرنامج تحديداً خطوتك التالية، واختم بأهدافك المستقبلية.",
          en: "A strong personal statement tells YOUR story. Start with a specific achievement or moment that sparked your passion. Show measurable impact (use numbers). Connect your experience clearly to why THIS program is your next step. End with your future goals.",
        },
      },
      {
        q: { ar: "كيف أرفع نتيجتي من الذكاء الاصطناعي؟", en: "How do I improve my AI score?" },
        a: {
          ar: "ارفع مسودة واحصل على ملاحظات الذكاء الاصطناعي، ثم عدّلها وأعد الرفع. كل جولة تحسّن نتيجتك عادةً بنقطة أو نقطتين. ركّز على المشاكل المحددة التي ظهرت في المراجعة — بدايات ضعيفة، إنجازات غامضة، روابط غير واضحة مع البرنامج.",
          en: "Upload a draft, get AI feedback, then revise and upload again. Each iteration typically improves your score by 1-2 points. Focus on the specific problems identified in your review — weak openings, vague achievements, unclear connections to the program.",
        },
      },
      {
        q: { ar: "هل يمكنني إعادة استخدام مستنداتي لمنح مختلفة؟", en: "Can I reuse documents for different scholarships?" },
        a: {
          ar: "نعم، لكن خصّصها دائماً! يمكن إعادة استخدام السيرة الذاتية إلى حد كبير، أما خطاب الدوافع فيجب تكييفه مع متطلبات كل منحة وقيمها. ابدأ من أفضل مسودة لديك وعدّل التركيز والأمثلة والأهداف.",
          en: "Yes, but always customize! Your CV/resume can be mostly reused. Your personal statement should be tailored to each scholarship's requirements and values. Start from your best draft and adjust the focus, examples, and goals.",
        },
      },
      {
        q: { ar: "كم مسودة ينبغي أن أرفع؟", en: "How many drafts should I upload?" },
        a: {
          ar: "معظم الطلاب يصلون إلى مستند قوي (نتيجة ٨ فأكثر) خلال مسودتين أو ثلاث. ارفع مسودتك الأولى للحصول على ملاحظات أساسية، ثم عدّل وفق الاقتراحات وأعد الرفع. نجد أن القفزة الأكبر تحدث بين المسودة الأولى والثانية.",
          en: "Most students reach a strong document (score 8+) in 2-3 drafts. Upload your first draft for baseline feedback, revise based on suggestions, then upload again. We find the biggest jump happens between draft 1 and 2.",
        },
      },
    ],
  },
  {
    id: "applications",
    category: { ar: "التقديمات", en: "Applications" },
    items: [
      {
        q: { ar: "ما الخطة الزمنية للتقديم؟", en: "What's the application timeline?" },
        a: {
          ar: "ننصح بما يلي: قبل الموعد النهائي بـ ٨-١٢ أسبوعاً — ابدأ البحث وتجهيز المستندات. قبل ٦-٨ أسابيع — المسودات الأولى لكل المستندات. قبل ٤-٦ أسابيع — مراجعات الذكاء الاصطناعي والتعديلات. قبل ٢-٤ أسابيع — الصقل النهائي والمراجعة. قبل أسبوع واحد — قدّم الطلب!",
          en: "We recommend: 8-12 weeks before deadline — start researching and preparing documents. 6-8 weeks — first drafts of all documents. 4-6 weeks — AI reviews and revisions. 2-4 weeks — final polish and review. 1 week — submit!",
        },
      },
      {
        q: { ar: "كيف أتابع طلباتي المتعددة؟", en: "How do I track multiple applications?" },
        a: {
          ar: "تعرض لوحتك جميع الطلبات النشطة مع أشرطة التقدّم. تتيح أداة المقارنة مقارنة ما يصل إلى ٤ منح جنباً إلى جنب. لكل طلب صفحة رحلة خاصة به تتضمن قائمة تحقق بالمستندات وخطة زمنية.",
          en: "Your dashboard shows all active applications with progress bars. The Compare tool lets you compare up to 4 scholarships side by side. Each application has its own journey page with document checklist and timeline.",
        },
      },
      {
        q: { ar: "متى أبدأ بالتقديم؟", en: "When should I start applying?" },
        a: {
          ar: "ابدأ بأسرع ما يمكن! معظم المنح لها مواعيد نهائية قبل بدء البرنامج بـ ٦-١٢ شهراً. استخدم مؤشرات المواعيد في لوحتك لتحديد الأولويات — الأحمر يعني عاجل (أقل من ١٥ يوماً)، والأصفر يعني قريب (١٥-٣٠ يوماً).",
          en: "Start as early as possible! Most scholarships have deadlines 6-12 months before the program starts. Use the deadline indicators on your dashboard to prioritize — red means urgent (under 15 days), yellow means soon (15-30 days).",
        },
      },
    ],
  },
  {
    id: "technical",
    category: { ar: "تقني", en: "Technical" },
    items: [
      {
        q: { ar: "كيف أرفع المستندات؟", en: "How do I upload documents?" },
        a: {
          ar: "انتقل إلى صفحة المستندات واضغط «ارفع مستنداً». اختر ملفاً من جهازك (PDF أو DOCX أو TXT، بحد أقصى ١٠MB). حدد نوع المستند (خطاب دوافع، سيرة ذاتية، إلخ) ثم اضغط رفع. يمكنك أيضاً الرفع من صفحة رحلة الطلب.",
          en: "Go to the Documents page and click 'Upload Document'. Select a file from your computer (PDF, DOCX, or TXT, max 10MB). Choose the document type (Personal Statement, CV, etc.) and click upload. You can also upload from the Application Journey page.",
        },
      },
      {
        q: { ar: "ما صيغ الملفات المدعومة؟", en: "What file formats are supported?" },
        a: {
          ar: "ندعم PDF (.pdf) وWord (.docx) والنص العادي (.txt). يُفضَّل PDF لأنه يحافظ على التنسيق. الحد الأقصى لحجم الملف ١٠MB. قد لا تعمل ملفات PDF الممسوحة ضوئياً (المبنية على الصور) مع استخراج النصوص بالذكاء الاصطناعي.",
          en: "We support PDF (.pdf), Word documents (.docx), and plain text (.txt). PDF is preferred as it preserves formatting. Maximum file size is 10MB. Scanned PDFs (image-based) may not work with our AI text extraction.",
        },
      },
      {
        q: { ar: "كيف أتواصل مع الدعم؟", en: "How do I contact support?" },
        a: {
          ar: `تواصل معنا عبر البريد على ${BRAND.supportEmail} لأي سؤال أو مشكلة — نرد عادةً خلال ٢٤ ساعة.`,
          en: `Reach out via email at ${BRAND.supportEmail} for any question or issue — we typically respond within 24 hours.`,
        },
      },
    ],
  },
];

export default function HelpPage() {
  const { pick } = useLanguage();
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const q = search.trim().toLowerCase();
  const filtered = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.ar.toLowerCase().includes(q) ||
        item.q.en.toLowerCase().includes(q) ||
        item.a.ar.toLowerCase().includes(q) ||
        item.a.en.toLowerCase().includes(q)
    ),
  })).filter((cat) => cat.items.length > 0);

  function toggle(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-4 w-4 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{pick("مركز المساعدة", "Help Center")}</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">{pick("الأسئلة الشائعة", "Frequently Asked Questions")}</h1>
          <p className="mt-2 text-white/80">
            {pick(
              `كل ما تحتاج معرفته عن استخدام ${BRAND.nameAr}`,
              `Everything you need to know about using ${BRAND.name}`
            )}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={pick("ابحث في الأسئلة…", "Search questions...")}
          className="w-full rounded-xl border border-input bg-background ps-9 pe-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-8">
        {filtered.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-h3 mb-4">{pick(cat.category.ar, cat.category.en)}</h2>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="rounded-xl border bg-card overflow-hidden transition-all">
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-start hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground pe-4">{pick(item.q.ar, item.q.en)}</span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <p className="text-sm text-muted-foreground leading-relaxed">{pick(item.a.ar, item.a.en)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">{pick("لا توجد نتائج", "No results found")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{pick("جرّب كلمات بحث مختلفة", "Try different search terms")}</p>
        </div>
      )}
    </div>
  );
}
