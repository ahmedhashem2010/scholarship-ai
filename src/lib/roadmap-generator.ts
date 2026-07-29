/**
 * Roadmap generator.
 *
 * Turns a deadline into a dated plan by working backwards from it.
 *
 * This is the feature competitors don't have. A listings site tells a student
 * "deadline: 15 March". That's useless on its own — it doesn't say that
 * recommendation letters need six weeks' notice, that IELTS results take two
 * weeks to arrive, or that a test has to be booked a month before it's sat.
 * Students miss deadlines not because they forget the date but because they
 * start three weeks too late.
 *
 * Everything here is offsets in days before the deadline. No AI, no network —
 * deterministic and instant.
 */

export type MilestoneKey =
  | "RESEARCH"
  | "ENGLISH_BOOK"
  | "ENGLISH_PREP"
  | "ENGLISH_SIT"
  | "ENGLISH_RESULTS"
  | "REQUEST_LETTERS"
  | "CHASE_LETTERS"
  | "DRAFT_STATEMENT"
  | "REVIEW_1"
  | "REVISE"
  | "REVIEW_2"
  | "RESEARCH_PROPOSAL"
  | "ORDER_TRANSCRIPT"
  | "PASSPORT"
  | "ASSEMBLE"
  | "SUBMIT"
  | "DEADLINE";

export interface Milestone {
  key: MilestoneKey;
  /** Days before the deadline this should happen. */
  offsetDays: number;
  date: Date;
  titleAr: string;
  titleEn: string;
  noteAr?: string;
  noteEn?: string;
  /** True for the deadline itself and the submit date. */
  critical?: boolean;
  /** Already in the past relative to `now`. */
  overdue?: boolean;
}

export interface RoadmapInput {
  deadline: Date | null;
  deadlineType?: string | null;
  requiredDocuments?: string[];
  targetDegree?: string | null;
  /** YES | WILLING | PREFER_WITHOUT */
  hasEnglishTest?: string | null;
  englishRequirement?: string | null;
  now?: Date;
}

export interface Roadmap {
  milestones: Milestone[];
  /** Total days from the first milestone to the deadline. */
  spanDays: number;
  /** True when there isn't enough time to do this properly. */
  compressed: boolean;
  /** Milestones already in the past. */
  overdueCount: number;
  reasonAr?: string;
  reasonEn?: string;
}

/**
 * Standard offsets, in days before the deadline.
 *
 * These aren't arbitrary. Referees genuinely need about six weeks. IELTS
 * results take ~13 days for the computer-delivered test. Universities are slow
 * with transcripts. Submitting a week early avoids the deadline-day server
 * crush, which is a real and recurring failure mode.
 */
const OFFSETS: Record<MilestoneKey, number> = {
  RESEARCH: 120,
  ENGLISH_PREP: 110,
  ENGLISH_BOOK: 100,
  ENGLISH_SIT: 70,
  ENGLISH_RESULTS: 56,
  REQUEST_LETTERS: 60,
  CHASE_LETTERS: 25,
  RESEARCH_PROPOSAL: 55,
  DRAFT_STATEMENT: 45,
  REVIEW_1: 35,
  REVISE: 28,
  REVIEW_2: 21,
  ORDER_TRANSCRIPT: 40,
  PASSPORT: 90,
  ASSEMBLE: 14,
  SUBMIT: 7,
  DEADLINE: 0,
};

const COPY: Record<MilestoneKey, { ar: string; en: string; noteAr?: string; noteEn?: string }> = {
  RESEARCH: {
    ar: "اقرأ شروط المنحة بالكامل",
    en: "Read the full scholarship terms",
    noteAr: "افتح الصفحة الرسمية وتأكد أنك مؤهل قبل أن تبدأ",
    noteEn: "Open the official page and confirm you're eligible before starting",
  },
  ENGLISH_PREP: {
    ar: "ابدأ التحضير للاختبار",
    en: "Start test preparation",
    noteAr: "من ٦ إلى ٨ أسابيع تحضير واقعية",
    noteEn: "6–8 weeks is realistic",
  },
  ENGLISH_BOOK: {
    ar: "احجز موعد الاختبار",
    en: "Book your test slot",
    noteAr: "المواعيد تمتلئ — احجز مبكراً",
    noteEn: "Slots fill up — book early",
  },
  ENGLISH_SIT: { ar: "أدِّ الاختبار", en: "Sit the test" },
  ENGLISH_RESULTS: {
    ar: "استلام النتيجة",
    en: "Results arrive",
    noteAr: "الآيلتس المحوسب: ٣–٥ أيام. الورقي: ١٣ يوماً",
    noteEn: "IELTS computer-delivered: 3–5 days. Paper: 13 days",
  },
  REQUEST_LETTERS: {
    ar: "اطلب خطابات التوصية",
    en: "Request recommendation letters",
    noteAr: "امنح أساتذتك ٦ أسابيع على الأقل — هذا أكثر ما يتأخر",
    noteEn: "Give referees at least 6 weeks — this is what delays applications most",
  },
  CHASE_LETTERS: {
    ar: "تابع خطابات التوصية",
    en: "Chase your referees",
    noteAr: "تذكير مهذب قبل ٣ أسابيع من الموعد",
    noteEn: "A polite reminder three weeks out",
  },
  RESEARCH_PROPOSAL: {
    ar: "اكتب المقترح البحثي",
    en: "Write your research proposal",
    noteAr: "أطول مستند في الطلب — ابدأ مبكراً",
    noteEn: "The longest document in the application — start early",
  },
  DRAFT_STATEMENT: {
    ar: "اكتب المسودة الأولى لخطاب الدوافع",
    en: "Draft your personal statement",
  },
  REVIEW_1: {
    ar: "المراجعة الأولى",
    en: "First review",
    noteAr: "ارفع المسودة واحصل على تقييم مفصّل",
    noteEn: "Upload the draft and get a scored review",
  },
  REVISE: { ar: "طبّق الملاحظات", en: "Apply the feedback" },
  REVIEW_2: {
    ar: "المراجعة الثانية",
    en: "Second review",
    noteAr: "تأكد أن التحسينات نجحت فعلاً",
    noteEn: "Confirm the revisions actually landed",
  },
  ORDER_TRANSCRIPT: {
    ar: "اطلب كشف الدرجات الرسمي",
    en: "Order official transcripts",
    noteAr: "الجامعات بطيئة — احسب ٣ أسابيع",
    noteEn: "Universities are slow — allow three weeks",
  },
  PASSPORT: {
    ar: "تأكد من صلاحية جواز السفر",
    en: "Check your passport is valid",
    noteAr: "يجب أن يكون صالحاً ٦ أشهر بعد بداية الدراسة",
    noteEn: "Must be valid 6 months beyond your start date",
  },
  ASSEMBLE: {
    ar: "جمّع كل المستندات",
    en: "Assemble everything",
    noteAr: "راجع القائمة بندًا بندًا",
    noteEn: "Check the required list item by item",
  },
  SUBMIT: {
    ar: "قدّم الطلب",
    en: "Submit",
    noteAr: "قبل أسبوع من الموعد — مواقع التقديم تنهار يوم الإغلاق",
    noteEn: "A week early — application portals crash on deadline day",
  },
  DEADLINE: { ar: "الموعد النهائي", en: "Deadline", critical: true } as any,
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Builds the roadmap.
 *
 * Returns an empty roadmap when there's no fixed deadline — a rolling
 * scholarship has nothing to count back from, and inventing dates would be
 * exactly the kind of confident-but-false output we're trying to avoid.
 */
export function generateRoadmap(input: RoadmapInput): Roadmap {
  const now = input.now ?? new Date();
  const { deadline } = input;

  if (!deadline) {
    return {
      milestones: [],
      spanDays: 0,
      compressed: false,
      overdueCount: 0,
      reasonAr:
        input.deadlineType === "ONGOING"
          ? "هذه المنحة مفتوحة باستمرار، فلا يوجد موعد نعود منه للخلف. جهّز مستنداتك وقدّم متى شئت."
          : "لا نعرف الموعد النهائي لهذه المنحة، لذا لا يمكننا بناء خطة زمنية. تحقّق من الصفحة الرسمية.",
      reasonEn:
        input.deadlineType === "ONGOING"
          ? "This scholarship is always open, so there's no deadline to work back from. Prepare your documents and apply whenever you're ready."
          : "We don't know this scholarship's deadline, so we can't build a timeline. Check the official page.",
    };
  }

  const docs = input.requiredDocuments ?? [];
  const degree = (input.targetDegree ?? "").toUpperCase();

  const keys: MilestoneKey[] = ["RESEARCH"];

  // English test track — only when they don't already hold a score AND the
  // scholarship actually asks for one.
  const needsTest =
    input.hasEnglishTest !== "YES" &&
    input.englishRequirement !== "NOT_REQUIRED" &&
    (docs.includes("ENGLISH_TEST") || Boolean(input.englishRequirement));

  if (needsTest) {
    keys.push("ENGLISH_PREP", "ENGLISH_BOOK", "ENGLISH_SIT", "ENGLISH_RESULTS");
  }

  if (docs.includes("RECOMMENDATION_LETTER")) {
    keys.push("REQUEST_LETTERS", "CHASE_LETTERS");
  }
  if (docs.includes("RESEARCH_PROPOSAL") || degree.includes("PHD")) {
    keys.push("RESEARCH_PROPOSAL");
  }
  if (docs.includes("TRANSCRIPT")) keys.push("ORDER_TRANSCRIPT");
  if (docs.includes("PASSPORT")) keys.push("PASSPORT");

  // Writing + review track always applies — every application has prose.
  keys.push("DRAFT_STATEMENT", "REVIEW_1", "REVISE", "REVIEW_2", "ASSEMBLE", "SUBMIT", "DEADLINE");

  const daysAvailable = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
  const maxOffset = Math.max(...keys.map((k) => OFFSETS[k]));

  // Not enough runway for the standard plan — squeeze it proportionally rather
  // than dropping steps, and flag it. A student with 30 days still needs to
  // know the order of operations.
  const compressed = daysAvailable > 0 && daysAvailable < maxOffset;
  const scale = compressed ? daysAvailable / maxOffset : 1;

  const milestones: Milestone[] = keys
    .map((key) => {
      const offset = Math.round(OFFSETS[key] * scale);
      const date = addDays(deadline, -offset);
      const copy = COPY[key];
      return {
        key,
        offsetDays: offset,
        date,
        titleAr: copy.ar,
        titleEn: copy.en,
        noteAr: copy.noteAr,
        noteEn: copy.noteEn,
        critical: key === "SUBMIT" || key === "DEADLINE",
        overdue: date.getTime() < now.getTime() && key !== "DEADLINE",
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    milestones,
    spanDays: maxOffset,
    compressed,
    overdueCount: milestones.filter((m) => m.overdue).length,
    reasonAr: compressed
      ? `الموعد بعد ${daysAvailable} يوماً فقط، والخطة الكاملة تحتاج ${maxOffset} يوماً. ضغطنا الجدول — ستحتاج للعمل بسرعة.`
      : undefined,
    reasonEn: compressed
      ? `The deadline is only ${daysAvailable} days away and a full plan needs ${maxOffset}. We've compressed the schedule — you'll need to move fast.`
      : undefined,
  };
}
