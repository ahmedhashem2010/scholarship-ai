"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Info } from "lucide-react";

/**
 * English step of onboarding.
 *
 * Replaces a single dropdown that mixed two different things:
 *
 *   Beginner / Intermediate / Advanced / Fluent / Native / TOEFL / IELTS
 *
 * Proficiency and test-possession are not the same question, and only the
 * second one decides eligibility. A fluent speaker with no certificate cannot
 * apply to a scholarship that requires IELTS 6.5; a mediocre speaker holding a
 * 6.5 can. The old field could not tell those two students apart.
 *
 * The branch also surfaces a genuinely underserved segment: students who want
 * scholarships that DON'T require an English test. Germany, Turkey, China and
 * several Egyptian government programmes qualify, and nobody indexes them well.
 */

export interface EnglishAnswers {
  hasEnglishTest: "" | "YES" | "WILLING" | "PREFER_WITHOUT";
  englishTestType: string;
  englishScore: string;
  englishTestDate: string;
  testTimeframe: string;
  englishLevel: string;
}

const TEST_TYPES = [
  { value: "IELTS", label: "IELTS", hint: "0–9" },
  { value: "TOEFL", label: "TOEFL iBT", hint: "0–120" },
  { value: "DUOLINGO", label: "Duolingo", hint: "10–160" },
  { value: "PTE", label: "PTE Academic", hint: "10–90" },
  { value: "CAMBRIDGE", label: "Cambridge", hint: "C1 / C2" },
];

const TIMEFRAMES = [
  { value: "<1M", ar: "خلال شهر", en: "Within a month" },
  { value: "1-3M", ar: "من ١ إلى ٣ أشهر", en: "1–3 months" },
  { value: "3-6M", ar: "من ٣ إلى ٦ أشهر", en: "3–6 months" },
  { value: "6M+", ar: "أكثر من ٦ أشهر", en: "More than 6 months" },
];

const LEVELS = [
  { value: "beginner", ar: "مبتدئ", en: "Beginner" },
  { value: "intermediate", ar: "متوسط", en: "Intermediate" },
  { value: "advanced", ar: "متقدم", en: "Advanced" },
  { value: "fluent", ar: "طليق", en: "Fluent" },
];

export function EnglishStep({
  value,
  onChange,
}: {
  value: EnglishAnswers;
  onChange: (patch: Partial<EnglishAnswers>) => void;
}) {
  const { pick } = useLanguage();

  /** A score older than two years is rejected by most scholarships. */
  const expiryWarning = (() => {
    if (!value.englishTestDate) return null;
    const taken = new Date(value.englishTestDate);
    const monthsOld = (Date.now() - taken.getTime()) / (1000 * 60 * 60 * 24 * 30.4);
    if (monthsOld > 24) {
      return pick(
        "هذه النتيجة أقدم من سنتين — معظم المنح لن تقبلها. ستحتاج لإعادة الاختبار.",
        "That score is over two years old — most scholarships won't accept it. You'll need to retake."
      );
    }
    if (monthsOld > 18) {
      return pick(
        "تنتهي صلاحية هذه النتيجة خلال أقل من ٦ أشهر. خطّط لإعادة الاختبار إن كان موعد المنحة بعيداً.",
        "This score expires in under 6 months. Plan a retake if your deadline is further out."
      );
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      {/* Q1 — the branch point ------------------------------------------- */}
      <fieldset>
        <legend className="text-sm font-medium text-foreground">
          {pick(
            "هل لديك نتيجة اختبار لغة إنجليزية؟",
            "Do you have an English test score?"
          )}
        </legend>
        <p className="mt-1 text-xs text-muted-foreground">
          {pick(
            "هذا أهم سؤال — كثير من المنح تشترط شهادة سارية، وبعضها لا يشترط شيئاً.",
            "This matters most — many scholarships require a valid certificate, and some require none at all."
          )}
        </p>

        <div className="mt-3 space-y-2">
          <Choice
            selected={value.hasEnglishTest === "YES"}
            onClick={() => onChange({ hasEnglishTest: "YES" })}
            title={pick("نعم، لديّ نتيجة", "Yes, I have a score")}
          />
          <Choice
            selected={value.hasEnglishTest === "WILLING"}
            onClick={() => onChange({ hasEnglishTest: "WILLING" })}
            title={pick("لا، لكنني مستعد لأداء الاختبار", "No, but I'm willing to take one")}
          />
          <Choice
            selected={value.hasEnglishTest === "PREFER_WITHOUT"}
            onClick={() => onChange({ hasEnglishTest: "PREFER_WITHOUT" })}
            title={pick(
              "أفضّل منحاً لا تشترط اختبار إنجليزية",
              "I'd prefer scholarships that don't require an English test"
            )}
            note={pick(
              "خيار واقعي — منح حكومية في ألمانيا وتركيا والصين ومصر لا تشترط ذلك",
              "A real option — government scholarships in Germany, Turkey, China and Egypt often don't"
            )}
          />
        </div>
      </fieldset>

      {/* Branch A — has a score ------------------------------------------ */}
      {value.hasEnglishTest === "YES" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              {pick("أي اختبار؟", "Which test?")}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEST_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => onChange({ englishTestType: tt.value })}
                  className={`rounded-lg border-2 px-3 py-2 text-sm transition ${
                    value.englishTestType === tt.value
                      ? "border-primary bg-primary/5 font-semibold text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span dir="ltr">{tt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {value.englishTestType && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="score" className="mb-1.5 block text-sm font-medium text-foreground">
                  {pick("الدرجة", "Your score")}
                  <span className="ms-1.5 text-xs font-normal text-muted-foreground" dir="ltr">
                    ({TEST_TYPES.find((t) => t.value === value.englishTestType)?.hint})
                  </span>
                </label>
                <Input
                  id="score"
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={value.englishScore}
                  onChange={(e) => onChange({ englishScore: e.target.value })}
                  placeholder={value.englishTestType === "TOEFL" ? "100" : "6.5"}
                />
              </div>
              <div>
                <label htmlFor="testdate" className="mb-1.5 block text-sm font-medium text-foreground">
                  {pick("تاريخ الاختبار", "Test date")}
                </label>
                <Input
                  id="testdate"
                  type="date"
                  dir="ltr"
                  value={value.englishTestDate}
                  onChange={(e) => onChange({ englishTestDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {expiryWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-[rgb(var(--accent-warm))]/40 bg-[rgb(var(--accent-warm))]/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--accent-warm))]" />
              <p className="text-xs leading-relaxed text-[rgb(var(--accent-warm))]">
                {expiryWarning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Branch B — willing to take one ---------------------------------- */}
      {value.hasEnglishTest === "WILLING" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              {pick("متى يمكنك أداؤه؟", "When could you take it?")}
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick(
                "نستخدم هذا لبناء خطتك الزمنية — التحضير والحجز واستلام النتيجة تستغرق وقتاً.",
                "We use this to build your roadmap — prep, booking and results all take time."
              )}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {TIMEFRAMES.map((tf) => (
                <Choice
                  key={tf.value}
                  selected={value.testTimeframe === tf.value}
                  onClick={() => onChange({ testTimeframe: tf.value })}
                  title={pick(tf.ar, tf.en)}
                  compact
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              {pick("ما مستواك الحالي تقريباً؟", "Roughly what's your current level?")}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => onChange({ englishLevel: l.value })}
                  className={`rounded-lg border-2 px-3 py-2 text-sm transition ${
                    value.englishLevel === l.value
                      ? "border-primary bg-primary/5 font-semibold text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {pick(l.ar, l.en)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branch C — prefers no test -------------------------------------- */}
      {value.hasEnglishTest === "PREFER_WITHOUT" && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-primary">
            {pick(
              "سنعطي الأولوية للمنح التي لا تشترط اختبار إنجليزية، أو التي تقبل خطاباً من جامعتك بدلاً منه. ستظل ترى المنح الأخرى، لكن في مرتبة أدنى.",
              "We'll prioritise scholarships that don't require an English test, or that accept a letter from your university instead. You'll still see the others, just ranked lower."
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function Choice({
  selected,
  onClick,
  title,
  note,
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  note?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border-2 text-start transition ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      } ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40"
      }`}
    >
      <span className={`block text-sm ${selected ? "font-semibold text-primary" : "text-foreground"}`}>
        {title}
      </span>
      {note && <span className="mt-0.5 block text-xs text-muted-foreground">{note}</span>}
    </button>
  );
}
