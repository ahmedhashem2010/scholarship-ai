import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Server-side guard for every page under /admin.
 *
 * Middleware already blocks these routes, but middleware can be bypassed by
 * misconfiguration (a matcher typo, a rewrite, a future route added outside the
 * pattern). This layout re-checks on the server so the admin surface fails
 * closed regardless of what happens upstream.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/admin/payments");
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const userEmail = user.email?.toLowerCase().trim();

  // No ADMIN_EMAIL configured means nobody is an admin. Fail closed.
  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
