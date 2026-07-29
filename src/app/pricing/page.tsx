"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { CreditCard, CheckCircle2, Sparkles, Star, Zap, Shield, Smartphone, Landmark, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Nav } from "@/components/nav";
import {
  CREDIT_PACKAGES,
  formatEGP,
  pricePerReview,
  savingsPercent,
  type CreditPackage,
} from "@/lib/pricing";
import {
  openWhatsApp,
  isWhatsAppConfigured,
  VODAFONE_CASH_NUMBER,
  INSTAPAY_HANDLE,
} from "@/lib/contact";

// Presentation only — prices, names, credits and features all come from
// src/lib/pricing.ts so they can never drift from what checkout actually charges.
const PACKAGE_ICONS: Record<string, typeof Star> = {
  "1-review": Star,
  "3-reviews": Zap,
  "5-reviews": Sparkles,
};

export default function PricingPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [showLocalOptions, setShowLocalOptions] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCardCheckout = async (pkg: CreditPackage) => {
    setProcessing(pkg.id);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, credits: pkg.credits }),
      });
      const data = await res.json();

      if (res.ok && data.url) {
        // External Stripe URL — router.push cannot navigate off-origin.
        window.location.href = data.url;
        return;
      }

      if (res.status === 401) {
        router.push(`/auth/login?redirectTo=/pricing`);
        return;
      }

      setCheckoutError(data.error ?? "Couldn't start checkout. Try a local payment method below.");
      setShowLocalOptions(true);
    } catch {
      setCheckoutError("Network error. Try a local payment method below.");
      setShowLocalOptions(true);
    } finally {
      setProcessing(null);
    }
  };

  const handleManualPayment = (pkg: CreditPackage) => {
    openWhatsApp(
      `Hi! I'd like to buy the ${pkg.name} package (${pkg.credits} review${pkg.credits > 1 ? "s" : ""} — $${pkg.price}).\n\nPlease send payment instructions.`
    );
  };

  return (
    <>
      <Nav />
      <main className="page-container">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-16 text-center text-white shadow-xl sm:px-16">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Choose Your Plan
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Get AI-powered document reviews to strengthen your scholarship applications. Each credit unlocks one in-depth review.
            </p>
          </div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </section>

        {checkoutError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {checkoutError}
          </div>
        )}

        <section className="mt-[-2.5rem]">
          <div className="grid gap-6 md:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const Icon = PACKAGE_ICONS[pkg.id] ?? Star;
              const savings = savingsPercent(pkg);
              return (
                <Card
                  key={pkg.id}
                  className={`card-hover relative flex flex-col border-2 bg-card transition-all duration-300 overflow-visible dark:bg-gray-800 ${
                    pkg.popular
                      ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-105 md:scale-110"
                      : "border-border dark:border-gray-700 hover:border-blue-200"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 overflow-visible">
                      <Badge className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold shadow-lg whitespace-nowrap">
                        <Sparkles className="me-1 inline h-3 w-3" />
                        Most popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={`pb-4 text-center ${pkg.popular ? "pt-8" : "pt-6"}`}>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      {pkg.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col items-center pb-6">
                    <div className="mb-4 text-center">
                      <span className="text-5xl font-extrabold text-foreground dark:text-white">
                        ${pkg.price}
                      </span>
                      <span className="ms-1 text-sm text-muted-foreground">once</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ≈ {formatEGP(pkg.price)}
                      </p>
                      <p className="mt-1.5 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-green-500" />
                        {pkg.credits} review{pkg.credits > 1 ? "s" : ""} · {pricePerReview(pkg)} each
                      </p>
                      {savings > 0 && (
                        <p className="mt-1 text-xs font-semibold text-green-600">
                          Save {savings}%
                        </p>
                      )}
                    </div>

                    <ul className="mb-6 w-full space-y-2.5">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto w-full space-y-2">
                      <Button
                        onClick={() => handleCardCheckout(pkg)}
                        disabled={processing === pkg.id}
                        className={`w-full ${
                          pkg.popular
                            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                            : "bg-muted text-foreground hover:bg-muted"
                        }`}
                      >
                        <CreditCard className="me-2 h-4 w-4" />
                        {processing === pkg.id ? "Processing..." : "Pay with Card"}
                      </Button>
                      {isWhatsAppConfigured() && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-1.5"
                          onClick={() => handleManualPayment(pkg)}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          Pay with Vodafone Cash / InstaPay
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {showLocalOptions && (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <h2 className="text-h4 font-bold text-emerald-900 mb-2">Local Payment Methods</h2>
            <p className="text-sm text-emerald-700 mb-6">
              Card payment is unavailable. You can pay via these Egyptian methods:
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-card border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Smartphone className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Vodafone Cash</p>
                <p className="text-xs text-emerald-600 font-mono mt-1">
                  {VODAFONE_CASH_NUMBER || "Message us for the number"}
                </p>
              </div>
              <div className="rounded-xl bg-card border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Banknote className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">InstaPay</p>
                <p className="text-xs text-emerald-600 font-mono mt-1">
                  {INSTAPAY_HANDLE || "Message us for the handle"}
                </p>
              </div>
              <div className="rounded-xl bg-card border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Landmark className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Bank Transfer</p>
                <p className="text-xs text-emerald-600 mt-1">Contact us for details</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-600 text-center">
              After paying, send us the receipt and your credits are added manually — usually within
              a few hours, and always within 24.
            </p>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Questions? Contact us on WhatsApp or email for help with payment.
        </p>
      </main>
    </>
  );
}
