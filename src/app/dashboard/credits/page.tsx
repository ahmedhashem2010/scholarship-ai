"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, CreditCard, Sparkles, Smartphone, Wallet, Loader2 } from "lucide-react"
import {
  CREDIT_PACKAGES,
  formatEGP,
  pricePerReview,
  savingsPercent,
  FREE_CREDITS_ON_SIGNUP,
  type CreditPackage,
} from "@/lib/pricing"
import { useCredits } from "@/lib/credits-context"

export default function CreditsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { credits, isLoading, refresh } = useCredits()

  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Stripe bounces back here with ?success=true. Re-fetch so the new balance
  // shows immediately rather than after a manual refresh.
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
      refresh()
    }
  }, [searchParams, refresh])

  async function handleCardCheckout(pkg: CreditPackage) {
    setProcessing(pkg.id)
    setError(null)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, credits: pkg.credits }),
      })
      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      if (res.status === 401) {
        router.push("/auth/login?redirectTo=/dashboard/credits")
        return
      }
      setError(data.error ?? "Couldn't start checkout. Try a local payment method below.")
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Get Credits</h1>
        <p className="text-muted-foreground mt-2">
          One credit buys one in-depth AI review of a document. Credits never expire.
        </p>
      </div>

      {/* Current balance */}
      <div className="mx-auto mb-8 flex max-w-sm items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">Your balance:</span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-lg font-bold">
            {credits} credit{credits === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {showSuccess && (
        <div
          role="status"
          className="mx-auto mb-6 max-w-2xl rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Payment received — your credits have been added. Thank you!
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mx-auto mb-6 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => {
          const savings = savingsPercent(pkg)
          return (
            <Card
              key={pkg.id}
              className={`relative flex flex-col overflow-visible ${
                pkg.popular ? "border-primary shadow-lg" : "border-border/50"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge variant="default" className="px-3 py-1 text-xs whitespace-nowrap">
                    Most popular
                  </Badge>
                </div>
              )}

              <CardHeader className={pkg.popular ? "pt-7" : ""}>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <p className="text-3xl font-bold mt-3">
                  ${pkg.price}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}/ {pkg.credits} review{pkg.credits > 1 ? "s" : ""}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ≈ {formatEGP(pkg.price)} · {pricePerReview(pkg)} per review
                </p>
                {savings > 0 && (
                  <p className="text-xs font-semibold text-green-600">Save {savings}%</p>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-3">
                {pkg.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}

                <div className="mt-auto space-y-2 pt-4">
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    disabled={processing === pkg.id}
                    onClick={() => handleCardCheckout(pkg)}
                  >
                    {processing === pkg.id ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        Starting checkout…
                      </>
                    ) : (
                      <>
                        <CreditCard className="me-2 h-4 w-4" />
                        Buy with card
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => router.push(`/dashboard/credits/manual?package=${pkg.id}`)}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Vodafone Cash / InstaPay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          New accounts start with {FREE_CREDITS_ON_SIGNUP} free credit
        </div>
      </div>
    </div>
  )
}
