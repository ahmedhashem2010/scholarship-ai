"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2 } from "lucide-react";

/**
 * "Check your inbox" screen.
 *
 * This page used to receive the confirmation link itself as a query parameter
 * and render it as a button — which meant the link sat in browser history,
 * in the Referer header of every asset the page loaded, and in any analytics
 * that captured URLs. A single-use credential granting a logged-in session
 * has no business being in a URL bar. The link now only ever exists inside
 * the email.
 */
function VerifyPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function resend() {
    if (!email) return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Couldn't send a new link. Try again shortly.");
        return;
      }
      setStatus("sent");
      setMessage("A new link is on its way. It can take a minute to arrive.");
    } catch {
      setStatus("error");
      setMessage("Network problem. Check your connection and try again.");
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center page-container py-8">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-h2 mb-2">Check your inbox</h1>
        <p className="text-muted-foreground mb-8">
          {email ? (
            <>
              We sent a confirmation link to{" "}
              <strong className="text-foreground" dir="ltr">
                {email}
              </strong>
            </>
          ) : (
            <>We sent you a confirmation link.</>
          )}
        </p>

        <Card>
          <CardContent className="pt-6 pb-6 space-y-5 text-start">
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  1
                </span>
                Open the email from SmartScholar.
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  2
                </span>
                Tap <strong className="text-foreground">تفعيل الحساب</strong> — you&apos;ll be
                signed in automatically.
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                  3
                </span>
                Not there? Check spam or promotions — new senders often land
                there first.
              </li>
            </ol>

            {message && (
              <div
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  status === "error"
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-success/30 bg-success/10 text-success"
                }`}
              >
                {status === "sent" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            {email && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resend}
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Send the link again"}
              </Button>
            )}

            <Link
              href="/auth/login"
              className="block text-center text-sm font-medium text-primary hover:text-primary-700 transition-colors"
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Still stuck? Email us at{" "}
          <a href="mailto:care@smartscholar.org" className="text-primary" dir="ltr">
            care@smartscholar.org
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
