"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";

/** Messages for the codes `/auth/confirm` redirects here with. */
const LINK_ERRORS: Record<string, string> = {
  link_expired: "That confirmation link has expired. Enter your email below and we'll send a fresh one.",
  link_invalid: "That confirmation link has already been used or isn't valid any more.",
  invalid_link: "That link was malformed. Request a new one below.",
};

/** Only allow same-site paths back out of the login redirect. */
function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    LINK_ERRORS[searchParams.get("error") ?? ""] ?? null
  );
  const [needsConfirm, setNeedsConfirm] = useState(
    Boolean(LINK_ERRORS[searchParams.get("error") ?? ""])
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resendConfirmation() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setNotice(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Couldn't send a new link. Try again shortly.");
      return;
    }
    setError(null);
    setNotice("Check your inbox — a new confirmation link is on its way.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      if (authError.message === "Invalid login credentials") {
        setError("Invalid email or password. Please try again.");
      } else if (/not confirmed/i.test(authError.message)) {
        // Not a dead end: offer the fix inline rather than telling them to go
        // and find an email that may never have arrived.
        setError("You haven't confirmed your email yet.");
        setNeedsConfirm(true);
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    router.push(safeRedirect(searchParams.get("redirectTo")));
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center page-container py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-h2">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue your scholarship journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background ps-9 pe-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background ps-9 pe-9 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger space-y-2">
                  <p>{error}</p>
                  {needsConfirm && (
                    <button
                      type="button"
                      onClick={resendConfirmation}
                      className="font-medium underline underline-offset-2"
                    >
                      Send me a new confirmation link
                    </button>
                  )}
                </div>
              )}

              {notice && (
                <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success">
                  {notice}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:text-primary-700 transition-colors">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure login powered by Supabase
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams forces a suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
