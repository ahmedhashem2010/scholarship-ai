"use client";

export const dynamic = 'force-dynamic';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowRight } from "lucide-react";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center page-container py-8">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-h2 mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-8">
          We sent a welcome email to <strong className="text-foreground">{email}</strong>
        </p>

        <Card>
          <CardContent className="pt-6 pb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Your account is ready. Sign in with your email and password to start exploring scholarships.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-700 transition-colors"
            >
              Go to sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
