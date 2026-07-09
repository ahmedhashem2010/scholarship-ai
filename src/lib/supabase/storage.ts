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

  const supabase = createAdminClient();

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
