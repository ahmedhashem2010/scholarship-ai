"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { CreditCard, CheckCircle2, Sparkles, Star, Zap, Shield, Smartphone, Landmark, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Nav } from "@/components/nav";

const packages = [
  {
    id: "1-review",
    credits: 1,
    price: 3,
    name: "Starter",
    description: "Perfect for a quick check",
    badge: null,
    icon: Star,
    features: ["1 AI document review", "Basic feedback report", "24hr delivery"],
    popular: false,
  },
  {
    id: "3-reviews",
    credits: 3,
    price: 8,
    name: "Popular",
    description: "Best for most students",
    badge: "Most Popular",
    icon: Zap,
    features: ["3 AI document reviews", "Detailed feedback reports", "Priority 12hr delivery", "Score tracking"],
    popular: true,
  },
  {
    id: "5-reviews",
    credits: 5,
    price: 12,
    name: "Pro",
    description: "For serious applicants",
    badge: "Best Value",
    icon: Sparkles,
    features: ["5 AI document reviews", "Comprehensive feedback reports", "Express 6hr delivery", "Score tracking", "Unlimited revisions"],
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [showLocalOptions, setShowLocalOptions] = useState(false);

  const handleCardCheckout = async (pkg: (typeof packages)[0]) => {
    setProcessing(pkg.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, credits: pkg.credits }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      } else {
        setShowLocalOptions(true);
      }
    } catch {
      setShowLocalOptions(true);
    } finally {
      setProcessing(null);
    }
  };

  const handleManualPayment = (pkg: (typeof packages)[0]) => {
    const message = encodeURIComponent(
      `Hi! I want to purchase the ${pkg.name} package (${pkg.credits} reviews - $${pkg.price}).\n\nPlease send payment instructions.`
    );
    window.open(`https://wa.me/201000000000?text=${message}`, "_blank");
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

        <section className="mt-[-2.5rem]">
          <div className="grid gap-6 md:grid-cols-3">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card
                  key={pkg.id}
                  className={`card-hover relative flex flex-col border-2 bg-white transition-all duration-300 overflow-visible dark:bg-gray-800 ${
                    pkg.popular
                      ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-105 md:scale-110"
                      : "border-slate-200 dark:border-gray-700 hover:border-blue-200"
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 overflow-visible">
                      <Badge className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold shadow-lg whitespace-nowrap">
                        <Sparkles className="mr-1 inline h-3 w-3" />
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={`pb-4 text-center ${pkg.popular ? "pt-8" : "pt-6"}`}>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {pkg.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500">{pkg.description}</p>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col items-center pb-6">
                    <div className="mb-4 text-center">
                      <span className="text-5xl font-extrabold text-slate-900">
                        ${pkg.price}
                      </span>
                      <span className="ml-1 text-sm text-slate-400">once</span>
                      <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                        <Shield className="h-3.5 w-3.5 text-green-500" />
                        {pkg.credits} review{pkg.credits > 1 ? "s" : ""}
                      </p>
                    </div>

                    <ul className="mb-6 w-full space-y-2.5">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
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
                            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                        }`}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {processing === pkg.id ? "Processing..." : "Pay with Card"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={() => handleManualPayment(pkg)}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        Pay with Vodafone Cash / InstaPay
                      </Button>
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
              <div className="rounded-xl bg-white border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Smartphone className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Vodafone Cash</p>
                <p className="text-xs text-emerald-600 font-mono mt-1">0100 000 0000</p>
              </div>
              <div className="rounded-xl bg-white border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Banknote className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">InstaPay</p>
                <p className="text-xs text-emerald-600 font-mono mt-1">@ScholarshipAI</p>
              </div>
              <div className="rounded-xl bg-white border border-emerald-100 p-4 text-center dark:bg-gray-800 dark:border-emerald-900">
                <Landmark className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Bank Transfer</p>
                <p className="text-xs text-emerald-600 mt-1">Contact us for details</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-600 text-center">
              After payment, send the receipt via WhatsApp or email and credits will be added within 24 hours.
            </p>
          </section>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Questions? Contact us on WhatsApp or email for help with payment.
        </p>
      </main>
    </>
  );
}
