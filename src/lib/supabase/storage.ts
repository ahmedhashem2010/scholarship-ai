import { createClient as createServerClient } from "./server";
import { createClient } from "@supabase/supabase-js";
import { DOCUMENTS_BUCKET, resolveStoragePath } from "./storage-paths";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

async function ensureBucket() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const existing = buckets?.find((b) => b.name === DOCUMENTS_BUCKET);
  if (!existing) {
    // PRIVATE. These are CVs, personal statements and recommendation letters —
    // documents containing a student's full name, address, grades and referees.
    // A public bucket means anyone who ever sees the URL keeps read access
    // forever, with no auth and no expiry. Files are served instead through
    // /api/documents/[id]/file, which checks ownership on every request.
    await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
    });
    return;
  }
  // A bucket created before the privacy hardening may still be public. Enforce
  // privacy on every upload, not just at creation time — creation config alone
  // is not a guarantee the bucket stayed private.
  if (existing.public) {
    const { error } = await supabase.storage.updateBucket(DOCUMENTS_BUCKET, { public: false });
    if (error) throw new Error(`Failed to enforce private bucket: ${error.message}`);
  }
}

export async function uploadFile(
  userId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${timestamp}_${safeName}`;

  let supabase;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  } else {
    supabase = createServerClient();
  }

  await ensureBucket();

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    if (error.message?.includes("row-level security")) {
      throw new Error(
        `Upload failed: Supabase Storage RLS policy required. ` +
        `Either set SUPABASE_SERVICE_ROLE_KEY in .env, or run this SQL in Supabase SQL editor:\n\n` +
        `CREATE POLICY "Users can upload their own files"\n` +
        `ON storage.objects FOR INSERT\n` +
        `TO authenticated\n` +
        `WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);`
      );
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Return the raw object path, never a public URL. A public storage URL would
  // bypass the ownership check in /api/documents/[id]/file and let anyone with
  // the link read the file. resolveStoragePath() keeps legacy rows (full URLs)
  // working for download/delete.
  return filePath;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const path = resolveStoragePath(fileUrl);
  if (!path) return;

  let supabase;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  } else {
    supabase = createServerClient();
  }

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function downloadFileAsBuffer(fileUrl: string): Promise<Buffer> {
  const path = resolveStoragePath(fileUrl);
  if (!path) throw new Error("Could not extract file path from URL");

  let supabase;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  } else {
    supabase = createServerClient();
  }

  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(path);
  if (error) throw new Error(`Download failed: ${error.message}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function ensureUserRecord(userId: string, email: string | undefined) {
  const { prisma } = await import("@/lib/prisma");
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  });
}
