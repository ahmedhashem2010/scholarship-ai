"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, CreditCard, Sparkles } from "lucide-react"
import Link from "next/link"

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Get Credits</h1>
        <p className="text-muted-foreground mt-2">
          Purchase credits to unlock AI document reviews and premium features
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        <Card className="relative border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Starter</CardTitle>
            <p className="text-3xl font-bold mt-2">
              $3
              <span className="text-base font-normal text-muted-foreground"> / review</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {["5 AI reviews", "Basic feedback", "Email support"].map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
            <Link href="/pricing">
              <Button className="w-full mt-4">Coming Soon</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="default" className="px-3 py-1 text-xs">Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Pro</CardTitle>
            <p className="text-3xl font-bold mt-2">
              $15
              <span className="text-base font-normal text-muted-foreground"> / month</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Unlimited AI reviews", "Detailed feedback", "Priority support", "Application tracking"].map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
            <Link href="/pricing">
              <Button className="w-full mt-4">Coming Soon</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Enterprise</CardTitle>
            <p className="text-3xl font-bold mt-2">
              Custom
              <span className="text-base font-normal text-muted-foreground"> / year</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Everything in Pro", "Dedicated mentor", "Bulk document review", "API access"].map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
            <Link href="/pricing">
              <Button variant="outline" className="w-full mt-4">Contact Us</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Free users get 1 free credit to start
        </div>
      </div>
    </div>
  )
}
