"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Smartphone, Landmark, Banknote, Upload, CheckCircle2,
  Loader2, ArrowLeft, Copy, Check,
} from "lucide-react";
import { CREDIT_PACKAGES, formatEGP, type CreditPackage } from "@/lib/pricing";
import {
  VODAFONE_CASH_NUMBER, INSTAPAY_HANDLE, isWhatsAppConfigured, openWhatsApp,
} from "@/lib/contact";

type Method = "vodafone_cash" | "instapay" | "bank_transfer";

const METHODS: { id: Method; label: string; icon: typeof Smartphone; detail: string }[] = [
  { id: "vodafone_cash", label: "Vodafone Cash", icon: Smartphone, detail: VODAFONE_CASH_NUMBER },
  { id: "instapay", label: "InstaPay", icon: Banknote, detail: INSTAPAY_HANDLE },
  { id: "bank_transfer", label: "Bank Transfer", icon: Landmark, detail: "" },
];

export default function ManualPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselected = CREDIT_PACKAGES.find((p) => p.id === searchParams.get("package"));
  const [pkg, setPkg] = useState<CreditPackage>(
    preselected ?? CREDIT_PACKAGES.find((p) => p.popular) ?? CREDIT_PACKAGES[0]!
  );
  const [method, setMethod] = useState<Method>("vodafone_cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeMethod = METHODS.find((m) => m.id === method);

  function copyDetail() {
    if (!activeMethod?.detail) return;
    navigator.clipboard.writeText(activeMethod.detail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!receipt && !reference.trim()) {
      setError("Please upload a screenshot of the transfer, or enter the transaction reference.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("packageId", pkg.id);
      form.append("method", method);
      if (reference.trim()) form.append("reference", reference.trim());
      if (note.trim()) form.append("userNote", note.trim());
      if (receipt) form.append("receipt", receipt);

      const res = await fetch("/api/payments/manual", { method: "POST", body: form });
      const data = await res.json();

      if (res.status === 401) {
        router.push("/auth/login?redirectTo=/dashboard/credits/manual");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Payment submitted</h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;ll verify your transfer and add{" "}
          <strong>{pkg.credits} credit{pkg.credits > 1 ? "s" : ""}</strong> to your
          account — usually within a few hours, always within 24. You&apos;ll get an
          email as soon as it&apos;s done.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto">Back to dashboard</Button>
          </Link>
          {isWhatsAppConfigured() && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                openWhatsApp(
                  `Hi! I just submitted a manual payment for the ${pkg.name} package ($${pkg.price}).`
                )
              }
            >
              Message us on WhatsApp
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <Link
        href="/dashboard/credits"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to credits
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Pay with a local method</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Transfer the amount, then tell us below. We verify manually and add your
        credits — no card needed.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Step 1 — package */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Choose a package</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPkg(p)}
                className={`rounded-xl border-2 p-3 text-start transition ${
                  pkg.id === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="mt-1 text-xl font-bold">${p.price}</p>
                <p className="text-xs text-muted-foreground">≈ {formatEGP(p.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.credits} review{p.credits > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Step 2 — method + where to send */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Send ${pkg.price} ({formatEGP(pkg.price)})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm transition ${
                      method === m.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              {activeMethod?.detail ? (
                <>
                  <p className="text-xs text-muted-foreground">Send to</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="font-mono text-lg font-semibold">{activeMethod.detail}</code>
                    <Button type="button" variant="ghost" size="sm" onClick={copyDetail}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isWhatsAppConfigured()
                    ? "Message us on WhatsApp and we'll send you the bank details."
                    : "Payment details aren't configured yet — please contact support."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3 — proof */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Show us the transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="receipt"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-7 text-center transition hover:border-primary/50"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                {receipt ? (
                  <span className="text-sm font-medium text-foreground">{receipt.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium">Upload a screenshot</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG or PDF · max 5MB</span>
                  </>
                )}
              </label>
              <input
                id="receipt"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="relative text-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">or / and</span>
            </div>

            <div>
              <label htmlFor="reference" className="mb-1.5 block text-sm font-medium">
                Transaction reference
              </label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. the number in your confirmation SMS"
              />
            </div>

            <div>
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
                Anything else? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sent from a different number, etc."
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            `Submit payment for ${pkg.credits} credit${pkg.credits > 1 ? "s" : ""}`
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Credits are added after we verify your transfer — usually a few hours.
          Nothing is charged automatically.
        </p>
      </form>
    </div>
  );
}
