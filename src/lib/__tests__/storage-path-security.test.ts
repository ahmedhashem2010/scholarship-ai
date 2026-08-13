// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveStoragePath } from "@/lib/supabase/storage-paths";
import { uploadFile, downloadFileAsBuffer, deleteFile } from "@/lib/supabase/storage";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const LEGACY_URL =
  "https://test.supabase.co/storage/v1/object/public/documents/user-1/cv.pdf";

describe("resolveStoragePath", () => {
  it("extracts the object path from a legacy public URL", () => {
    expect(resolveStoragePath(LEGACY_URL)).toBe("user-1/cv.pdf");
  });

  it("passes through a raw object path (new upload format)", () => {
    expect(resolveStoragePath("user-1/cv.pdf")).toBe("user-1/cv.pdf");
  });

  it("returns null for empty input", () => {
    expect(resolveStoragePath(null)).toBeNull();
    expect(resolveStoragePath("")).toBeNull();
  });
});

describe("uploadFile — never produces a public storage URL", () => {
  const upload = vi.fn();
  const listBuckets = vi.fn();
  const createBucket = vi.fn();
  const updateBucket = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    upload.mockResolvedValue({ error: null });
    listBuckets.mockResolvedValue({ data: [], error: null });
    createBucket.mockResolvedValue({ error: null });
    updateBucket.mockResolvedValue({ error: null });
    createClient.mockReturnValue({
      storage: {
        listBuckets,
        createBucket,
        updateBucket,
        from: () => ({ upload }),
      },
    });
  });

  it("returns a raw object path, not a URL", async () => {
    const file = new File(["resume"], "my-cv.pdf", { type: "application/pdf" });
    const result = await uploadFile("user-1", file);

    expect(result).toMatch(/^user-1\/\d+_my-cv\.pdf$/);
    expect(result).not.toContain("http");
    expect(result).not.toContain("storage/v1/object/public");
    expect(upload).toHaveBeenCalledTimes(1);
    // Object path, not a public-URL leak.
    expect(upload.mock.calls[0]![0]).toMatch(/^user-1\//);
  });

  it("creates the bucket private when it does not exist", async () => {
    const file = new File(["x"], "cv.pdf", { type: "application/pdf" });
    await uploadFile("user-1", file);
    expect(createBucket).toHaveBeenCalledWith(
      "documents",
      expect.objectContaining({ public: false })
    );
    expect(updateBucket).not.toHaveBeenCalled();
  });

  it("repairs an existing public bucket to private", async () => {
    listBuckets.mockResolvedValue({
      data: [{ name: "documents", public: true }],
      error: null,
    });
    const file = new File(["x"], "cv.pdf", { type: "application/pdf" });
    await uploadFile("user-1", file);
    expect(updateBucket).toHaveBeenCalledWith("documents", { public: false });
    expect(createBucket).not.toHaveBeenCalled();
  });

  it("leaves an existing private bucket alone", async () => {
    listBuckets.mockResolvedValue({
      data: [{ name: "documents", public: false }],
      error: null,
    });
    const file = new File(["x"], "cv.pdf", { type: "application/pdf" });
    await uploadFile("user-1", file);
    expect(updateBucket).not.toHaveBeenCalled();
    expect(createBucket).not.toHaveBeenCalled();
  });
});

describe("downloadFileAsBuffer / deleteFile — resolve both path formats", () => {
  const download = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    download.mockResolvedValue({ data: new Blob(["resume text"]), error: null });
    remove.mockResolvedValue({ error: null });
    createClient.mockReturnValue({
      storage: { from: () => ({ download, remove }) },
    });
  });

  it("downloads by object path when given a raw path", async () => {
    const buf = await downloadFileAsBuffer("user-1/cv.pdf");
    expect(download).toHaveBeenCalledWith("user-1/cv.pdf");
    expect(buf.toString()).toBe("resume text");
  });

  it("downloads by object path when given a legacy public URL", async () => {
    await downloadFileAsBuffer(LEGACY_URL);
    expect(download).toHaveBeenCalledWith("user-1/cv.pdf");
  });

  it("deletes by object path from a raw path", async () => {
    await deleteFile("user-1/cv.pdf");
    expect(remove).toHaveBeenCalledWith(["user-1/cv.pdf"]);
  });

  it("deletes by object path from a legacy public URL", async () => {
    await deleteFile(LEGACY_URL);
    expect(remove).toHaveBeenCalledWith(["user-1/cv.pdf"]);
  });

  it("no-ops when the path cannot be resolved", async () => {
    await deleteFile("");
    expect(remove).not.toHaveBeenCalled();
  });
});
