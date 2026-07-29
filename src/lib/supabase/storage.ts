import { createClient as createServerClient } from "./server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "documents";

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
  if (buckets?.some((b) => b.name === BUCKET)) return;
  // PRIVATE. These are CVs, personal statements and recommendation letters —
  // documents containing a student's full name, address, grades and referees.
  // A public bucket means anyone who ever sees the URL keeps read access
  // forever, with no auth and no expiry. Files are served instead through
  // /api/documents/[id]/file, which checks ownership on every request.
  await supabase.storage.createBucket(BUCKET, {
    public: false,
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  });
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
    .from(BUCKET)
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

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const path = fileUrl.split(`/${BUCKET}/`)[1];
  if (!path) return;

  let supabase;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  } else {
    supabase = createServerClient();
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function downloadFileAsBuffer(fileUrl: string): Promise<Buffer> {
  const path = fileUrl.split(`/${BUCKET}/`)[1];
  if (!path) throw new Error("Could not extract file path from URL");

  let supabase;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  } else {
    supabase = createServerClient();
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(path);
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

// ---------------------------------------------------------------------------
// Payment receipts
//
// A SEPARATE bucket from `documents`, so that a policy mistake on one can't
// expose the other. Both are private. Receipts are especially sensitive —
// they're screenshots of bank and wallet transfers — so they are never served
// through the app at all, only via short-lived signed URLs to the admin.
// ---------------------------------------------------------------------------

const RECEIPTS_BUCKET = "receipts";

async function ensureReceiptsBucket() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = createAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === RECEIPTS_BUCKET)) return;
  await supabase.storage.createBucket(RECEIPTS_BUCKET, {
    public: false,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    fileSizeLimit: 5 * 1024 * 1024,
  });
}

/** Uploads a payment receipt. Returns the storage PATH, not a public URL. */
export async function uploadReceipt(userId: string, file: File): Promise<string> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Receipt upload requires SUPABASE_SERVICE_ROLE_KEY");
  }
  await ensureReceiptsBucket();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const filePath = `${userId}/${Date.now()}_${safeName}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Receipt upload failed: ${error.message}`);
  return filePath;
}

/** Short-lived signed URL for an admin to view a receipt. */
export async function getReceiptSignedUrl(
  path: string,
  expiresInSeconds = 300
): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error("[storage] Failed to sign receipt URL:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
