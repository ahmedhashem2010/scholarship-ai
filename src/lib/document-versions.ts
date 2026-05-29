import { prisma } from "@/lib/prisma";

const MAX_VERSIONS = 5;

export async function createNewVersion(
  parentDocumentId: string,
  newFileUrl: string,
  newFileData: { fileName: string; fileType: string; fileSize: number }
) {
  const parent = await prisma.document.findUnique({
    where: { id: parentDocumentId },
    include: { childVersions: true, reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!parent) throw new Error("Parent document not found");

  if (parent.version >= MAX_VERSIONS) {
    throw new Error(`Maximum of ${MAX_VERSIONS} versions per document reached.`);
  }

  const newDoc = await prisma.document.create({
    data: {
      userId: parent.userId,
      fileName: newFileData.fileName,
      fileUrl: newFileUrl,
      fileType: newFileData.fileType,
      fileSize: newFileData.fileSize,
      documentType: parent.documentType,
      version: parent.version + 1,
      parentDocumentId: parent.id,
    },
  });

  return newDoc;
}

export async function getVersionChain(documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { parentDocument: true },
  });
  if (!doc) return [];

  const chain: {
    id: string;
    version: number;
    score: number | null;
    improvementScore: number | null;
    createdAt: string;
    isCurrent: boolean;
  }[] = [];

  const currentScore = await getLatestScore(documentId);
  chain.push({
    id: doc.id,
    version: doc.version,
    score: currentScore,
    improvementScore: doc.improvementScore,
    createdAt: doc.uploadedAt.toISOString(),
    isCurrent: true,
  });

  let current = doc;
  while (current.parentDocument) {
    const parent = current.parentDocument;
    const score = await getLatestScore(parent.id);
    chain.unshift({
      id: parent.id,
      version: parent.version,
      score,
      improvementScore: parent.improvementScore,
      createdAt: parent.uploadedAt.toISOString(),
      isCurrent: false,
    });
    if (!parent.parentDocumentId) break;
    current = await prisma.document.findUnique({
      where: { id: parent.parentDocumentId },
      include: { parentDocument: true },
    }) as typeof parent & { parentDocument: typeof parent | null };
    if (!current) break;
  }

  return chain;
}

export async function compareVersions(docIdA: string, docIdB: string) {
  const [docA, docB] = await Promise.all([
    prisma.document.findUnique({
      where: { id: docIdA },
      include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.document.findUnique({
      where: { id: docIdB },
      include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  if (!docA || !docB) throw new Error("Document not found");

  const reviewA = docA.reviews[0];
  const reviewB = docB.reviews[0];

  return {
    older: {
      id: docA.id,
      version: docA.version,
      score: reviewA?.score ?? null,
      strengths: reviewA ? safeParseJson(reviewA.strengths) : [],
      weaknesses: reviewA ? safeParseJson(reviewA.weaknesses) : [],
      createdAt: docA.uploadedAt.toISOString(),
    },
    newer: {
      id: docB.id,
      version: docB.version,
      score: reviewB?.score ?? null,
      strengths: reviewB ? safeParseJson(reviewB.strengths) : [],
      weaknesses: reviewB ? safeParseJson(reviewB.weaknesses) : [],
      createdAt: docB.uploadedAt.toISOString(),
    },
  };
}

export function getImprovementInsight(
  oldScore: number | null,
  newScore: number | null
): { type: "improved" | "declined" | "same" | "first"; message: string; icon: string } {
  if (oldScore === null || newScore === null) {
    return { type: "first", message: "First version - no comparison available.", icon: "📄" };
  }

  const diff = newScore - oldScore;

  if (diff >= 2) {
    return {
      type: "improved",
      message: `🎉 Great job! +${diff.toFixed(1)} improvement. You're making excellent progress! Keep going!`,
      icon: "🎉",
    };
  }

  if (diff > 0) {
    return {
      type: "improved",
      message: `📈 Good progress! +${diff.toFixed(1)} improvement. You're heading in the right direction.`,
      icon: "📈",
    };
  }

  if (diff === 0) {
    return {
      type: "same",
      message: "Score stayed the same. Try focusing on the specific feedback areas mentioned above.",
      icon: "💪",
    };
  }

  return {
    type: "declined",
    message: `⚠️ Your score went down by ${Math.abs(diff).toFixed(1)}. Review the feedback carefully and address each point in your next version.`,
    icon: "⚠️",
  };
}

async function getLatestScore(documentId: string): Promise<number | null> {
  const review = await prisma.review.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: { score: true },
  });
  return review?.score ?? null;
}

function safeParseJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getVersionLimit(): number {
  return MAX_VERSIONS;
}
