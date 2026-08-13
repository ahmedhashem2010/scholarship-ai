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

async function getLatestScore(documentId: string): Promise<number | null> {
  const review = await prisma.review.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: { score: true },
  });
  return review?.score ?? null;
}
