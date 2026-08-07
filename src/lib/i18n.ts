/**
 * Translation dictionary.
 *
 * Before this, "Arabic support" meant flipping `dir="rtl"` — every word on the
 * page stayed in English. An Arabic-first product needs actual Arabic.
 *
 * Scope is deliberate: landing page, navigation, onboarding and shared UI.
 * The dashboard internals stay English for launch; translating everything is a
 * week-two job and would blow the sprint.
 *
 * The Arabic here is written, not machine-translated. Where a natural Arabic
 * phrasing differs from the English, the Arabic wins — it's the primary
 * language for this audience.
 */

export type Language = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const t: Dict = {
  // --- Navigation -----------------------------------------------------------
  "nav.scholarships": { ar: "المنح", en: "Scholarships" },
  "nav.dashboard": { ar: "لوحتي", en: "Dashboard" },
  "nav.documents": { ar: "مستنداتي", en: "Documents" },
  "nav.roadmap": { ar: "خطتي", en: "My plan" },
  "nav.pricing": { ar: "الأسعار", en: "Pricing" },
  "nav.help": { ar: "المساعدة", en: "Help" },
  "nav.login": { ar: "تسجيل الدخول", en: "Log in" },
  "nav.signup": { ar: "ابدأ مجاناً", en: "Get started" },
  "nav.features": { ar: "المميزات", en: "Features" },
  "nav.how": { ar: "كيف يعمل", en: "How it works" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "nav.logout": { ar: "تسجيل الخروج", en: "Log out" },
  "nav.profile": { ar: "ملفي الشخصي", en: "Profile" },
  "nav.credits": { ar: "الرصيد", en: "Credits" },
  "nav.applications": { ar: "طلباتي", en: "My applications" },
  "nav.settings": { ar: "الإعدادات", en: "Settings" },
  "nav.aiAssistant": { ar: "المساعد الذكي", en: "AI Assistant" },

  // --- Landing: hero --------------------------------------------------------
  "hero.headline": {
    ar: "اعثر على المنح التي يمكنك الفوز بها فعلاً",
    en: "Find the scholarships you can actually win",
  },
  "hero.sub": {
    ar: "توقّف عن تصفّح مئات المنح غير المناسبة. أخبرنا عن نفسك، وسنعرض لك ما تنطبق عليك شروطه — مع خطة زمنية واضحة لكل خطوة.",
    en: "Stop scrolling past hundreds of scholarships you'll never qualify for. Tell us about yourself and we'll show you the ones that fit — with a dated plan for every step.",
  },
  "hero.cta": { ar: "اعرف المنح المناسبة لك", en: "Get matched" },
  "hero.ctaSecondary": { ar: "تصفّح المنح", en: "Browse scholarships" },
  "hero.noCard": { ar: "مجاني للبدء · بدون بطاقة ائتمان", en: "Free to start · no credit card" },
  "hero.badge": { ar: "للطلاب العرب حول العالم", en: "For Arab students worldwide" },
  "hero.hl1": { ar: "اعثر على المنح", en: "Find the scholarships" },
  "hero.hl2": { ar: "التي يمكنك الفوز بها فعلاً", en: "you can actually win" },
  "hero.trust1": { ar: "مجاني للبدء", en: "Free to start" },
  "hero.trust2": { ar: "بيانات متحقق منها", en: "Verified data" },
  "hero.trust3": { ar: "بدون بطاقة ائتمان", en: "No credit card" },
  "hero.scroll": { ar: "اكتشف المزيد", en: "Explore more" },

  // --- Landing: social proof -----------------------------------------------
  "proof.scholarships": { ar: "منحة دراسية", en: "scholarships" },
  "proof.countries": { ar: "دولة", en: "countries" },
  "proof.verified": { ar: "تم التحقق منها يدوياً", en: "human-verified" },

  // --- Landing: how it works -----------------------------------------------
  "how.overline": { ar: "كيف يعمل", en: "How it works" },
  "how.title": {
    ar: "من ملفك إلى التقديم في خمس خطوات",
    en: "From profile to application in five steps",
  },
  "how.sub": {
    ar: "نظام واحد يأخذ بيدك من أول زيارة حتى إرسال الطلب — بخطوات واضحة وتواريخ محددة.",
    en: "One system walks you from your first visit to a submitted application — clear steps, dated milestones, no guesswork.",
  },
  "how.s1.title": { ar: "أنشئ ملفك", en: "Build your profile" },
  "how.s1.body": {
    ar: "خمس دقائق: بلدك، درجتك، تخصصك، معدلك، ومستوى الإنجليزية.",
    en: "Five minutes: your country, degree, field, GPA and English level.",
  },
  "how.s2.title": { ar: "شاهد تطابقك", en: "Get your AI matches" },
  "how.s2.body": {
    ar: "نقيّم كل منحة مقابل ملفك ونعرض النسبة مع سبب واضح لكل نتيجة.",
    en: "We score every scholarship against your profile — with a clear reason for each result.",
  },
  "how.s3.title": { ar: "حسّن مستنداتك", en: "Polish your documents" },
  "how.s3.body": {
    ar: "ارفع سيرتك أو خطاب الدوافع واحصل على مراجعة بدرجة وتحسينات محددة.",
    en: "Upload your CV or statement and get a scored review with specific fixes.",
  },
  "how.s4.title": { ar: "اتبع خطتك الزمنية", en: "Follow your roadmap" },
  "how.s4.body": {
    ar: "مواعيد محددة: متى تحجز الاختبار، متى تطلب التوصيات، ومتى تبدأ الكتابة.",
    en: "Dated milestones: when to book your test, request letters, and start writing.",
  },
  "how.s5.title": { ar: "قدّم بثقة", en: "Submit with confidence" },
  "how.s5.body": {
    ar: "طلب مكتمل قبل الموعد النهائي بوقت كافٍ، بدل التقديم في اللحظة الأخيرة.",
    en: "A complete application well before the deadline — not a last-minute scramble.",
  },

  // --- Landing: sections ----------------------------------------------------
  "section.featured": { ar: "منح مفتوحة الآن", en: "Open right now" },
  "section.featuredSub": {
    ar: "عيّنة من قاعدة بياناتنا — سجّل لترى ما يناسبك أنت",
    en: "A sample from our database — sign up to see what fits you",
  },
  "section.pricing": { ar: "الأسعار", en: "Pricing" },
  "section.pricingSub": {
    ar: "البحث عن المنح والخطة الزمنية مجاناً دائماً. ادفع فقط مقابل مراجعة مستنداتك.",
    en: "Matching and roadmaps are always free. You only pay for document reviews.",
  },
  "section.faq": { ar: "أسئلة شائعة", en: "Common questions" },

  // --- Landing: stats -------------------------------------------------------
  "stats.overline": { ar: "الأرقام تتحدث", en: "By the numbers" },
  "stats.title": { ar: "يثق بنا طلاب في كل العالم العربي", en: "Trusted by students across the Arab world" },
  "stats.sub": {
    ar: "من القاهرة إلى الدار البيضاء، يساعد SmartScholar الطلاب على التقديم للمنح الصحيحة — دون إضاعة الوقت.",
    en: "From Cairo to Casablanca, SmartScholar helps students apply to the right scholarships — and skip the rest.",
  },
  "stats.scholarships": { ar: "منحة مُختارة يدوياً", en: "curated scholarships" },
  "stats.countries": { ar: "دولة حول العالم", en: "countries covered" },
  "stats.accuracy": { ar: "دقة التطابق بالذكاء الاصطناعي", en: "AI match accuracy" },
  "stats.reviewed": { ar: "طلب تمت مراجعته", en: "applications reviewed" },

  // --- Landing: AI features -------------------------------------------------
  "feat.overline": { ar: "مميزات الذكاء الاصطناعي", en: "AI features" },
  "feat.title": { ar: "كل ما تحتاجه للفوز بمنحة، في مكان واحد", en: "Everything you need to win a scholarship" },
  "feat.sub": {
    ar: "أدوات مدعومة بالذكاء الاصطناعي صُممت لطلاب المنح تحديداً — لا ميزات عامة، فقط ما يوصلك إلى التقديم.",
    en: "AI tools built specifically for scholarship applicants — nothing generic, just what gets you to submit.",
  },

  // --- Landing: scholarship showcase ----------------------------------------
  "show.overline": { ar: "منح مفتوحة الآن", en: "Open right now" },
  "show.title": { ar: "منح حقيقية، بمواعيد حقيقية", en: "Real scholarships, real deadlines" },
  "show.sub": {
    ar: "منح حكومية ودولية كبرى تفتح سنوياً. سجّل لتظهر لك المنح المناسبة لملفك أنت.",
    en: "Major government and international scholarships that open every year. Sign up to see the ones that fit you.",
  },
  "show.match": { ar: "تطابق", en: "match" },
  "show.apply": { ar: "قدّم الآن", en: "Apply now" },
  "show.viewAll": { ar: "تصفّح كل المنح", en: "View all scholarships" },

  // --- Landing: why SmartScholar ---------------------------------------------
  "why.overline": { ar: "لماذا SmartScholar", en: "Why SmartScholar" },
  "why.title": {
    ar: "البحث التقليدي عن المنح مكسور. أصلحناه.",
    en: "Traditional scholarship hunting is broken. We fixed it.",
  },
  "why.sub": {
    ar: "كل منصة أخرى تعطيك قائمة طويلة وتتركك وحيداً. نحن نعطيك إجابة واضحة وخطة كاملة.",
    en: "Every other platform hands you a long list and leaves you alone. We give you a clear answer and a full plan.",
  },
  "why.oldTitle": { ar: "البحث التقليدي", en: "The old way" },
  "why.newTitle": { ar: "مع SmartScholar AI", en: "With SmartScholar AI" },

  // --- Landing: testimonials -------------------------------------------------
  "testi.overline": { ar: "قصص نجاح", en: "Student success" },
  "testi.title": { ar: "طلاب فازوا بمنح — بخطة واضحة", en: "Students who won, with a clear plan" },
  "testi.sub": {
    ar: "آلاف الطلاب العرب يحوّلون «أريد منحة» من حلم غامض إلى خطوات واضحة.",
    en: "Thousands of Arab students are turning “I want a scholarship” from a vague dream into concrete steps.",
  },

  // --- Landing: FAQ -----------------------------------------------------------
  "faq.overline": { ar: "الأسئلة الشائعة", en: "FAQ" },
  "faq.title": { ar: "أسئلة يطرحها كل طالب", en: "Questions every student asks" },
  "faq.sub": {
    ar: "وإن لم تجد إجابتك، اكتب لنا وسنرد خلال يوم عمل واحد.",
    en: "Can't find your answer? Email us and we'll reply within one business day.",
  },

  // --- Landing: final CTA -----------------------------------------------------
  "cta.title": { ar: "منحتك تبدأ بملف شخصي", en: "Your scholarship starts with a profile" },
  "cta.sub": {
    ar: "أنشئ ملفك في دقيقتين وشاهد المنح التي تنطبق عليك شروطها فعلاً — مجاناً.",
    en: "Set up your profile in two minutes and see the scholarships you actually qualify for — for free.",
  },
  "cta.note": {
    ar: "مجاني للبدء · بدون بطاقة ائتمان · بدون رسائل مزعجة",
    en: "Free to start · No credit card · No spam",
  },

  // --- Landing: trust strip ---------------------------------------------------
  "trust.title": {
    ar: "محبوب لدى الطلاب الطموحين في كل العالم العربي",
    en: "Loved by ambitious students across the Arab world",
  },
  "trust.rating": {
    ar: "متوسط تقييم ٤٫٩ من ٥ · أكثر من ٢٬٠٠٠ طالب",
    en: "4.9/5 average · 2,000+ students",
  },
  "trust.from": { ar: "طلاب من", en: "Students from" },
  "trust.more": { ar: "+٢٠ دولة", en: "+20 more countries" },

  // --- Landing: application timeline ------------------------------------------
  "time.overline": { ar: "الخطة الزمنية", en: "Your roadmap" },
  "time.title": {
    ar: "كل موعد نهائي، محسوب بالعكس حتى اليوم",
    en: "Every deadline, worked back to today",
  },
  "time.sub": {
    ar: "موعد واحد لا يكفي. نحوّله إلى خطة مواعيد محددة: متى تحجز الاختبار، متى تطلب التوصيات، ومتى تبدأ الكتابة.",
    en: "One date isn't a plan. We turn it into dated milestones: when to book the test, ask for letters, and start writing.",
  },
  "time.m1": { ar: "احجز الآيلتس", en: "Book IELTS" },
  "time.m2": { ar: "اطلب التوصيات", en: "Ask for letters" },
  "time.m3": { ar: "اكتب الخطاب", en: "Draft statement" },
  "time.m4": { ar: "مراجعة أخيرة", en: "Final review" },
  "time.submit": { ar: "قدّم الطلب", en: "Submit" },
  "time.deadline": { ar: "الموعد النهائي", en: "Deadline" },
  "time.before": { ar: "يوم قبل الموعد", en: "days before" },
  "time.f1": {
    ar: "تُنشأ تلقائياً من كل موعد نهائي في قائمتك",
    en: "Auto-generated from every deadline on your list",
  },
  "time.f2": { ar: "تذكير بالبريد عند كل خطوة", en: "Email reminders at every step" },
  "time.f3": {
    ar: "تتكيف مع مستنداتك ومواعيدك الحقيقية",
    en: "Adapts to your real documents and dates",
  },
  "time.cta": { ar: "أنشئ خطتك", en: "Build your roadmap" },

  // --- Landing: student success ------------------------------------------------
  "succ.overline": { ar: "قصص نجاح", en: "Student success" },
  "succ.title": { ar: "نتائج حقيقية، بأرقام حقيقية", en: "Real students, real results" },
  "succ.sub": {
    ar: "هذه ليست وعوداً — هذه ما يفعله المنتج فعلاً.",
    en: "These aren't promises. This is what the product actually does.",
  },

  // --- Landing: universities ----------------------------------------------------
  "uni.overline": { ar: "أين يدرسون الآن", en: "Where they study now" },
  "uni.title": { ar: "جامعات غيّرت حياتهم", en: "Universities that changed their lives" },
  "uni.sub": {
    ar: "من أكسفورد إلى ETH زيورخ — يدرس طلابنا في أكثر من ٤٠ جامعة عالمية مرموقة.",
    en: "From Oxford to ETH Zürich — our students study at 40+ world-class universities.",
  },

  // --- Landing: footer ---------------------------------------------------------
  "foot.about": {
    ar: "نطابق الطلاب العرب مع المنح التي تنطبق عليهم شروطها فعلاً، ونرافقهم حتى التقديم.",
    en: "We match Arab students to scholarships they truly qualify for, then guide them to a strong application.",
  },
  "foot.resources": { ar: "روابط مفيدة", en: "Resources" },
  "foot.scholarships": { ar: "المنح", en: "Scholarships" },
  "foot.tools": { ar: "أدوات الذكاء الاصطناعي", en: "AI tools" },
  "foot.contact": { ar: "تواصل معنا", en: "Contact" },
  "foot.social": { ar: "تابعنا", en: "Follow us" },
  "foot.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  "foot.resource.browse": { ar: "تصفّح المنح", en: "Browse scholarships" },
  "foot.resource.pricing": { ar: "الأسعار", en: "Pricing" },
  "foot.resource.help": { ar: "مركز المساعدة", en: "Help center" },
  "foot.resource.glossary": { ar: "مصطلحات المنح", en: "Scholarship glossary" },
  "foot.sch.chevening": { ar: "منحة تشيفنينغ", en: "Chevening" },
  "foot.sch.daad": { ar: "منحة DAAD", en: "DAAD" },
  "foot.sch.fulbright": { ar: "منحة فولبرايت", en: "Fulbright" },
  "foot.sch.erasmus": { ar: "إيراسموس موندوس", en: "Erasmus Mundus" },
  "foot.tool.matching": { ar: "المطابقة الذكية", en: "AI matching" },
  "foot.tool.review": { ar: "مراجعة المستندات", en: "Document review" },
  "foot.tool.roadmap": { ar: "الخطة الزمنية", en: "Application roadmap" },
  "foot.tool.chat": { ar: "المساعد الذكي", en: "AI chat assistant" },
  "foot.social.x": { ar: "منصة إكس", en: "X (Twitter)" },
  "foot.social.instagram": { ar: "إنستغرام", en: "Instagram" },
  "foot.social.linkedin": { ar: "لينكد إن", en: "LinkedIn" },
  "foot.social.youtube": { ar: "يوتيوب", en: "YouTube" },
  "foot.contact.email": { ar: "الدعم", en: "Email support" },
  "foot.contact.privacy": { ar: "سياسة الخصوصية", en: "Privacy" },
  "foot.contact.terms": { ar: "الشروط", en: "Terms" },

  // --- Common ---------------------------------------------------------------
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.apply": { ar: "قدّم", en: "Apply" },
  "common.getStarted": { ar: "ابدأ مجاناً", en: "Get started" },

  // --- Scholarship card / detail -------------------------------------------
  "sch.deadline": { ar: "آخر موعد", en: "Deadline" },
  "sch.daysLeft": { ar: "يوماً متبقياً", en: "days left" },
  "sch.ongoing": { ar: "مفتوحة باستمرار", en: "Rolling — always open" },
  "sch.deadlineUnknown": { ar: "الموعد غير محدد", en: "Deadline not listed" },
  "sch.fitScore": { ar: "نسبة التطابق", en: "Fit score" },
  "sch.whyMatch": { ar: "لماذا تناسبك", en: "Why you match" },
  "sch.whyNot": { ar: "ما قد يمنعك", en: "What might block you" },
  "sch.unverified": { ar: "لم يتم التحقق منها بعد", en: "Not yet verified" },
  "sch.unknownInfo": { ar: "معلومات غير مذكورة في المصدر", en: "Not stated by the source" },
  "sch.verifiedOn": { ar: "تم التحقق في", en: "Verified" },
  "sch.viewOfficial": { ar: "الصفحة الرسمية", en: "Official page" },
  "sch.requiredDocs": { ar: "المستندات المطلوبة", en: "Required documents" },
  "sch.benefits": { ar: "ما تغطيه المنحة", en: "What it covers" },
  "sch.eligibility": { ar: "شروط الأهلية", en: "Eligibility" },
  "sch.save": { ar: "احفظ المنحة", en: "Save scholarship" },
  "sch.saved": { ar: "محفوظة", en: "Saved" },

  // --- Dashboard ------------------------------------------------------------
  "dash.greeting": { ar: "أهلاً", en: "Hi" },
  "dash.nextStep": { ar: "خطوتك التالية", en: "Your next step" },
  "dash.deadlines": { ar: "أقرب المواعيد", en: "Upcoming deadlines" },
  "dash.matches": { ar: "أفضل المنح لك", en: "Your best matches" },
  "dash.documents": { ar: "مستنداتك", en: "Your documents" },
  "dash.viewAll": { ar: "عرض الكل", en: "View all" },

  // --- Empty states ---------------------------------------------------------
  "empty.noMatches.title": { ar: "لا توجد نتائج بعد", en: "No matches yet" },
  "empty.noMatches.body": {
    ar: "أكمل ملفك الشخصي وسنعرض لك المنح المناسبة خلال ثوانٍ.",
    en: "Complete your profile and we'll show you matching scholarships in seconds.",
  },
  "empty.noMatches.cta": { ar: "أكمل ملفي", en: "Complete profile" },
  "empty.noDocs.title": { ar: "لم ترفع أي مستند", en: "No documents yet" },
  "empty.noDocs.body": {
    ar: "ارفع سيرتك الذاتية أو خطاب الدوافع لتحصل على مراجعة مفصّلة.",
    en: "Upload your CV or personal statement to get a detailed review.",
  },
  "empty.noDocs.cta": { ar: "ارفع مستنداً", en: "Upload a document" },

  // --- Onboarding -----------------------------------------------------------
  "onb.step": { ar: "خطوة", en: "Step" },
  "onb.of": { ar: "من", en: "of" },
  "onb.next": { ar: "التالي", en: "Next" },
  "onb.back": { ar: "السابق", en: "Back" },
  "onb.finish": { ar: "إنهاء", en: "Finish" },
  "onb.about": { ar: "عنك", en: "About you" },
  "onb.education": { ar: "دراستك", en: "Education" },
  "onb.english": { ar: "الإنجليزية", en: "English" },
  "onb.experience": { ar: "خبرتك", en: "Experience" },
  "onb.review": { ar: "مراجعة", en: "Review" },
  "onb.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "onb.dob": { ar: "تاريخ الميلاد", en: "Date of birth" },
  "onb.country": { ar: "بلد الجنسية", en: "Country of citizenship" },

  // --- Common ---------------------------------------------------------------
  "common.loading": { ar: "جارِ التحميل…", en: "Loading…" },
  "common.error": { ar: "حدث خطأ ما", en: "Something went wrong" },
  "common.retry": { ar: "أعد المحاولة", en: "Try again" },
  "common.free": { ar: "مجاناً", en: "Free" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.search": { ar: "ابحث", en: "Search" },
  "common.backToTop": { ar: "العودة للأعلى", en: "Back to top" },
};

/** Looks up a key. Returns the key itself if missing, so gaps are visible. */
export function translate(key: string, lang: Language): string {
  const entry = t[key];
  if (!entry) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return key;
  }
  return entry[lang];
}

/**
 * Arabic-Indic numerals. Arabic speakers in MENA read both, but dates and
 * counts feel noticeably more native in Arabic-Indic within Arabic copy.
 */
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function localiseNumber(n: number | string, lang: Language): string {
  if (lang === "en") return String(n);
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]!);
}
