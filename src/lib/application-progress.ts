export const DOC_PRIORITY: Record<string, number> = {
  RESEARCH_PROPOSAL: 1,
  PERSONAL_STATEMENT: 1,
  MOTIVATION_LETTER: 1,
  CV: 2,
  RECOMMENDATION_LETTER: 3,
  TRANSCRIPT: 4,
  MEDICAL_CERTIFICATE: 5,
  OTHER: 6,
};

export const DOC_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  RESEARCH_PROPOSAL: { ar: "المقترح البحثي", en: "Research Proposal" },
  CV: { ar: "السيرة الذاتية", en: "CV / Resume" },
  PERSONAL_STATEMENT: { ar: "خطاب الدوافع", en: "Personal Statement" },
  RECOMMENDATION_LETTER: { ar: "خطاب التوصية", en: "Recommendation Letter" },
  TRANSCRIPT: { ar: "كشف الدرجات والشهادات", en: "Transcripts & Certificates" },
  MOTIVATION_LETTER: { ar: "خطاب التحفيز", en: "Motivation Letter" },
  MEDICAL_CERTIFICATE: { ar: "شهادة طبية", en: "Medical Certificate" },
  OTHER: { ar: "مستند آخر", en: "Other Document" },
};

export function calculateProgress(
  documents: { status: string }[]
): number {
  if (documents.length === 0) return 5;
  const completedDocs = documents.filter((d) => d.status === "READY").length;
  return Math.round(10 + (completedDocs / documents.length) * 60);
}

export function getNextAction(
  documents: { status: string; documentType: string; aiScore?: number | null }[],
  isRTL = false
): string {
  const pending = documents
    .filter((d) => d.status !== "READY")
    .sort((a, b) => {
      const pa = DOC_PRIORITY[a.documentType] ?? 99;
      const pb = DOC_PRIORITY[b.documentType] ?? 99;
      return pa - pb;
    });

  if (pending.length === 0) {
    return isRTL
      ? "كل المستندات جاهزة! راجع طلبك وقدّمه."
      : "All documents ready! Review and submit your application.";
  }

  const next = pending[0]!;
  const labelEntry = DOC_TYPE_LABELS[next.documentType];
  const label = labelEntry ? (isRTL ? labelEntry.ar : labelEntry.en) : next.documentType.toLowerCase();

  if (next.status === "NOT_STARTED") {
    return isRTL ? `ابدأ العمل على ${label}` : `Start working on your ${label}`;
  }
  if (next.status === "NEEDS_IMPROVEMENT") {
    return isRTL
      ? `حسّن ${label} (الدرجة الحالية: ${next.aiScore ?? "؟"}/10)`
      : `Improve your ${label} (current score: ${next.aiScore ?? "?"}/10)`;
  }
  if (next.status === "IN_REVIEW") {
    return isRTL ? `راجع ملاحظات الذكاء الاصطناعي على ${label}` : `Review AI feedback for your ${label}`;
  }
  return isRTL ? `تابع العمل على ${label}` : `Continue working on your ${label}`;
}

export function getDeadlineUrgency(
  deadline: string | null,
  isRTL = false
): {
  label: string;
  color: "red" | "yellow" | "green" | "gray";
  daysLeft: number | null;
} {
  if (!deadline) return { label: isRTL ? "لا يوجد موعد نهائي" : "No deadline", color: "gray", daysLeft: null };
  const diff = new Date(deadline).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const label = isRTL ? `${daysLeft} يوم متبقٍ` : `${daysLeft} days left`;
  if (daysLeft < 15) return { label, color: "red", daysLeft };
  if (daysLeft <= 30) return { label, color: "yellow", daysLeft };
  return { label, color: "green", daysLeft };
}

export function autoUpdateDocStatus(status: string, aiScore: number | null): string {
  if (!aiScore) return status;
  if (aiScore >= 7) return "READY";
  if (aiScore >= 5) return "NEEDS_IMPROVEMENT";
  return "NEEDS_IMPROVEMENT";
}

export function shouldAutoCompletePhase(
  phase: number,
  documents: { status: string; aiScore?: number | null }[]
): boolean {
  switch (phase) {
    case 1:
      return true;
    case 2:
      return documents.length > 0 && documents.every((d) => d.status === "READY");
    case 3:
    case 4:
      return false;
    default:
      return false;
  }
}

export function getCurrentPhase(documents: { status: string; aiScore?: number | null }[]): number {
  if (!shouldAutoCompletePhase(2, documents)) return 2;
  return 1;
}
