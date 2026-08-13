'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, TrendingUp, Award, Star, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const stories = [
  {
    name: "Ahmed",
    country: { ar: "مصر", en: "Egypt" },
    scholarship: { ar: "منحة MEXT (اليابان)", en: "MEXT Scholarship (Japan)" },
    initialScore: 6,
    finalScore: 8.5,
    drafts: 3,
    accepted: true,
    quote: {
      ar: "ساعدتني ملاحظات الذكاء الاصطناعي على رؤية نقاط ضعف لم أكن لأكتشفها بنفسي. كل مراجعة أشارت إلى أشياء محددة لتعديلها، وكانت نتيجتي ترتفع في كل مرة.",
      en: "The AI feedback helped me see weaknesses I couldn't spot myself. Each review pointed out specific things to fix, and my score went up every time.",
    },
    improvements: [
      { ar: "بداية خطاب الدوافع كانت عامة جداً", en: "Personal statement opening was too generic" },
      { ar: "السيرة الذاتية تفتقر إلى إنجازات قابلة للقياس", en: "CV lacked quantified achievements" },
      { ar: "نطاق المقترح البحثي كان واسعاً جداً", en: "Research proposal scope was too broad" },
    ],
  },
  {
    name: "Layla",
    country: { ar: "السعودية", en: "Saudi Arabia" },
    scholarship: { ar: "منحة ستيبينديوم هنغاريكم (المجر)", en: "Stipendium Hungaricum (Hungary)" },
    initialScore: 5.5,
    finalScore: 9,
    drafts: 4,
    accepted: true,
    quote: {
      ar: "كنت على وشك إرسال مسودتي الأولى، لكن الذكاء الاصطناعي رصد أخطاءً نحوية فاتتني تماماً. الملاحظات بأسلوب الإرشاد جعلت التحسّن يبدو قابلاً للتحقيق.",
      en: "I was going to submit my first draft, but the AI caught grammar issues I'd missed completely. The coaching-style feedback made improvement feel achievable.",
    },
    improvements: [
      { ar: "خطاب الدوافع كان يحتاج خاتمة أقوى", en: "Motivation letter needed stronger conclusion" },
      { ar: "مستوى الإنجليزية كان دون المطلوب — تحسّن بالممارسة", en: "English level was below requirement — improved through practice" },
    ],
  },
  {
    name: "Omar",
    country: { ar: "الأردن", en: "Jordan" },
    scholarship: { ar: "منحة تشيفنينغ (بريطانيا)", en: "Chevening Scholarship (UK)" },
    initialScore: 7,
    finalScore: 9.5,
    drafts: 2,
    accepted: true,
    quote: {
      ar: "أظهرت لي خوارزمية المطابقة منحاً لم أكن أضعها في الاعتبار. أفضل منحة لي لم تكن التي كنت أظنها — وتم قبولي!",
      en: "The matching algorithm showed me scholarships I hadn't considered. My best match wasn't the one I thought — and I got accepted!",
    },
    improvements: [
      { ar: "أمثلة القيادة كانت تحتاج أثراً أكبر", en: "Leadership examples needed more impact" },
      { ar: "قسم الخبرة العملية كان طويلاً جداً", en: "Work experience section was too long" },
    ],
  },
  {
    name: "Mariam",
    country: { ar: "الإمارات", en: "UAE" },
    scholarship: { ar: "منحة DAAD (ألمانيا)", en: "DAAD Scholarship (Germany)" },
    initialScore: 4,
    finalScore: 7.5,
    drafts: 5,
    accepted: true,
    quote: {
      ar: "بدأت بمسودة ضعيفة جداً وكدت أستسلم. قائمة الخطوات التفصيلية في كل مراجعة جعلت الأمر ممكناً. بعد خمس مسودات، أصبح لدي مستند أفخر به.",
      en: "I started with a very weak draft and almost gave up. The step-by-step checklist in each review made it manageable. Five drafts later, I had a document I was proud of.",
    },
    improvements: [
      { ar: "المقترح البحثي كان يحتاج قسماً للمنهجية", en: "Research proposal needed methodology section" },
      { ar: "أخطاء نحوية في كامل النص", en: "Grammar issues throughout" },
      { ar: "خطاب الدوافع كان يفتقر إلى اتجاه واضح", en: "Personal statement lacked direction" },
    ],
  },
  {
    name: "Youssef",
    country: { ar: "المغرب", en: "Morocco" },
    scholarship: { ar: "منحة إيفل للتميز (فرنسا)", en: "Eiffel Excellence (France)" },
    initialScore: 6.5,
    finalScore: 8,
    drafts: 3,
    accepted: false,
    quote: {
      ar: "لم أحصل على المنحة، لكن المنصة أعدّتني جيداً للطلب التالي. مستنداتي الآن جاهزة للتقديم لأي فرصة مماثلة.",
      en: "I didn't get the scholarship, but the platform prepared me well for the next application. My documents are now submission-ready for any similar opportunity.",
    },
    improvements: [
      { ar: "قسم اللغة الفرنسية كان يحتاج مزيداً من التفاصيل", en: "French language section needed more detail" },
      { ar: "الإنجازات الأكاديمية كانت بحاجة إلى عرض أفضل", en: "Academic achievements needed better presentation" },
    ],
  },
];

function getImprovementEmoji(initial: number, final: number): string {
  const diff = final - initial;
  if (diff >= 3) return "🔥";
  if (diff >= 2) return "📈";
  return "👍";
}

export default function SuccessStoriesPage() {
  const { pick, num } = useLanguage();

  return (
    <div className="page-container py-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{pick("نتائج حقيقية", "Real Results")}</span>
          </div>
          <h1 className="text-h2 sm:text-h1 mt-2">{pick("قصص نجاح", "Success Stories")}</h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            {pick(
              "طلاب حقيقيون حسّنوا طلباتهم وحققوا أهدافهم من المنح",
              "Real students who improved their applications and achieved their scholarship goals"
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, i) => (
          <Card key={i} className="flex flex-col card-hover">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary text-sm font-bold">
                    {story.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{story.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{pick(story.country.ar, story.country.en)}</p>
                  </div>
                </div>
                {story.accepted ? (
                  <Badge variant="green" className="text-[10px]">{pick("مقبول", "Accepted")}</Badge>
                ) : (
                  <Badge variant="yellow" className="text-[10px]">{pick("قيد التقديم", "In Progress")}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pick(story.scholarship.ar, story.scholarship.en)}</p>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{pick("النتيجة:", "Score:")}</span>
                  <span className="text-sm font-bold text-danger">{num(story.initialScore)}</span>
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span className="text-sm font-bold text-success">{num(story.finalScore)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {pick(`· ${num(story.drafts)} مسودات`, `· ${story.drafts} drafts`)}
                </span>
                <span className="text-sm">{getImprovementEmoji(story.initialScore, story.finalScore)}</span>
              </div>

              <div className="rounded-lg bg-muted p-3 relative">
                <Quote className="h-3 w-3 text-muted-foreground absolute top-2 start-2" />
                <p className="text-xs text-muted-foreground italic ps-4">
                  &ldquo;{pick(story.quote.ar, story.quote.en)}&rdquo;
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {pick("أبرز التحسينات", "Key Improvements")}
                </p>
                <ul className="space-y-1">
                  {story.improvements.map((imp, j) => (
                    <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-success mt-0.5">•</span>
                      {pick(imp.ar, imp.en)}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{pick("قصة نجاحك تبدأ من هنا", "Your success story starts here")}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {pick(
            "ابدأ رحلة التقديم اليوم. مع ملاحظات مدعومة بالذكاء الاصطناعي ومطابقة شخصية، أنت بالفعل أقرب خطوة من منحتك.",
            "Start your application journey today. With AI-powered feedback and personalized matching, you're already one step closer to your scholarship."
          )}
        </p>
      </div>
    </div>
  );
}
