"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const confirmLink = searchParams.get("link") || "";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center page-container py-8">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-h2 mb-2">Almost there!</h1>
        <p className="text-muted-foreground mb-8">
          Account created for <strong className="text-foreground">{email}</strong>
        </p>

        <Card>
          <CardContent className="pt-6 pb-6 space-y-4">
            {confirmLink && (
              <a
                href={confirmLink}
                className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm my email
              </a>
            )}
            <p className="text-sm text-muted-foreground">
              Click the button above to confirm your account, then sign in.
            </p>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                If the button doesn&apos;t work, check your spam folder or try signing up again.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="block text-center text-sm font-medium text-primary hover:text-primary-700 transition-colors"
            >
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
