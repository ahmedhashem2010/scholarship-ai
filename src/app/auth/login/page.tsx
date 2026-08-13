"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/** Messages for the codes `/auth/confirm` redirects here with. */
const LINK_ERRORS: Record<string, { ar: string; en: string }> = {
  link_expired: {
    ar: "انتهت صلاحية رابط التأكيد هذا. أدخل بريدك الإلكتروني بالأسفل وسنرسل لك رابطاً جديداً.",
    en: "That confirmation link has expired. Enter your email below and we'll send a fresh one.",
  },
  link_invalid: {
    ar: "تم استخدام رابط التأكيد هذا بالفعل أو لم يعد صالحاً.",
    en: "That confirmation link has already been used or isn't valid any more.",
  },
  invalid_link: {
    ar: "الرابط لم يكن صحيحاً. اطلب رابطاً جديداً من الأسفل.",
    en: "That link was malformed. Request a new one below.",
  },
};

/** Only allow same-site paths back out of the login redirect. */
function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/** Same localStorage key LanguageContext uses — see signup/page.tsx for why this reads it directly. */
function currentSiteLang(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("smartscholar.lang") === "ar" ? "ar" : "en";
}

function LoginPageContent() {
  const { pick } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorParam = searchParams.get("error") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [linkError, setLinkError] = useState<{ ar: string; en: string } | null>(
    LINK_ERRORS[errorParam] ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(Boolean(LINK_ERRORS[errorParam]));
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resendConfirmation() {
    if (!email) {
      setError(pick("أدخل بريدك الإلكتروني أولاً.", "Enter your email address first."));
      return;
    }
    setNotice(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lang: currentSiteLang() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        data.error || pick("تعذّر إرسال رابط جديد. حاول مرة أخرى بعد قليل.", "Couldn't send a new link. Try again shortly.")
      );
      return;
    }
    setError(null);
    setLinkError(null);
    setNotice(pick("تفقّد بريدك الوارد — رابط تأكيد جديد في الطريق إليك.", "Check your inbox — a new confirmation link is on its way."));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLinkError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      if (authError.message === "Invalid login credentials") {
        setError(pick("البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مجدداً.", "Invalid email or password. Please try again."));
      } else if (/not confirmed/i.test(authError.message)) {
        // Not a dead end: offer the fix inline rather than telling them to go
        // and find an email that may never have arrived.
        setError(pick("لم تؤكد بريدك الإلكتروني بعد.", "You haven't confirmed your email yet."));
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
          <h1 className="text-h2">{pick("مرحباً بعودتك", "Welcome back")}</h1>
          <p className="text-muted-foreground mt-2">
            {pick("سجّل دخولك لمتابعة رحلتك مع المنح الدراسية", "Sign in to continue your scholarship journey")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{pick("تسجيل الدخول", "Sign In")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  {pick("البريد الإلكتروني", "Email")}
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
                  {pick("كلمة المرور", "Password")}
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
                    placeholder={pick("أدخل كلمة المرور", "Enter your password")}
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

              {(error || linkError) && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger space-y-2">
                  <p>{error ?? (linkError ? pick(linkError.ar, linkError.en) : null)}</p>
                  {needsConfirm && (
                    <button
                      type="button"
                      onClick={resendConfirmation}
                      className="font-medium underline underline-offset-2"
                    >
                      {pick("أرسل لي رابط تأكيد جديداً", "Send me a new confirmation link")}
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
                {loading ? pick("جارٍ تسجيل الدخول…", "Signing in...") : pick("تسجيل الدخول", "Sign In")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {pick("ليس لديك حساب؟", "Don't have an account?")}{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:text-primary-700 transition-colors">
                {pick("أنشئ حساباً", "Create one")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {pick("تسجيل دخول آمن مدعوم من Supabase", "Secure login powered by Supabase")}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  // useSearchParams forces a suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
