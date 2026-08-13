"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPage() {
  const { pick, num } = useLanguage();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h2 font-bold text-foreground mb-8">{pick("سياسة الخصوصية", "Privacy Policy")}</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong>{pick("آخر تحديث:", "Last updated:")}</strong> {pick("مايو", "May")} {num(2026)}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(1)}. {pick("المعلومات التي نجمعها", "Information We Collect")}
        </h2>
        <p>
          {pick(
            "نجمع المعلومات التي تقدّمها عند إنشاء حساب، أو رفع مستندات، أو استخدام خدمات مراجعة الذكاء الاصطناعي لدينا. تشمل هذه المعلومات اسمك وعنوان بريدك الإلكتروني وخلفيتك التعليمية ومحتوى المستندات.",
            "We collect information you provide when creating an account, uploading documents, and using our AI review services. This includes your name, email address, educational background, and document content.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(2)}. {pick("كيف نستخدم معلوماتك", "How We Use Your Information")}
        </h2>
        <p>
          {pick(
            "تُستخدم معلوماتك لتوفير مطابقة المنح، ومراجعة المستندات بالذكاء الاصطناعي، والتوصيات المخصصة. يُرسل محتوى المستندات إلى مزوّد الذكاء الاصطناعي لدينا (AgentRouter/Claude) لغرض واحد فقط هو توليد التغذية الراجعة.",
            "Your information is used to provide scholarship matching, AI document reviews, and personalized recommendations. Document content is sent to our AI provider (AgentRouter/Claude) solely for the purpose of generating feedback.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(3)}. {pick("تخزين البيانات وأمانها", "Data Storage & Security")}
        </h2>
        <p>
          {pick(
            "تُخزَّن بياناتك بأمان باستخدام البنية التحتية لـ Supabase. نطبّق إجراءات أمنية وفق معايير الصناعة، بما في ذلك التشفير أثناء النقل وعند التخزين.",
            "Your data is stored securely using Supabase infrastructure. We implement industry-standard security measures including encryption in transit and at rest.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(4)}. {pick("خدمات الأطراف الثالثة", "Third-Party Services")}
        </h2>
        <p>
          {pick(
            "نستخدم Supabase للمصادقة والتخزين، وAgentRouter/Anthropic Claude لمراجعة المستندات بالذكاء الاصطناعي. لكل من هذه الخدمات سياسة خصوصية خاصة بها تنظّم التعامل مع البيانات.",
            "We use Supabase for authentication and storage, and AgentRouter/Anthropic Claude for AI-powered document reviews. These services have their own privacy policies governing data handling.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(5)}. {pick("حقوقك", "Your Rights")}
        </h2>
        <p>
          {pick(
            "يحق لك الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت. تواصل معنا لممارسة هذه الحقوق.",
            "You have the right to access, correct, or delete your personal data at any time. Contact us to exercise these rights.",
          )}
        </p>

        <h2 className="text-h4 font-semibold text-foreground mt-8">
          {num(6)}. {pick("التواصل معنا", "Contact")}
        </h2>
        <p>
          {pick(
            "للاستفسارات المتعلقة بالخصوصية، يرجى التواصل معنا عبر قنوات الدعم لدينا.",
            "For privacy-related inquiries, please contact us through our support channels.",
          )}
        </p>
      </div>
    </main>
  );
}
