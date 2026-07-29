"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw,
  Clock, Wallet, AlertCircle,
} from "lucide-react";

interface AdminPayment {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  status: string;
  method: string;
  packageId: string | null;
  reference: string | null;
  userNote: string | null;
  receiptSignedUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  user: { email: string | null; name: string | null; reviewCredits: number } | null;
}

const METHOD_LABELS: Record<string, string> = {
  stripe: "Card (Stripe)",
  vodafone_cash: "Vodafone Cash",
  instapay: "InstaPay",
  bank_transfer: "Bank Transfer",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't load payments");
        return;
      }
      setPayments(json.data ?? []);
    } catch {
      setError("Network error loading payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Why are you rejecting this? (the student will see this)") ?? "";
      if (!reason.trim()) return;
    } else if (!window.confirm("Approve this payment and grant the credits?")) {
      return;
    }

    setActing(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Action failed");
        return;
      }
      await load();
    } catch {
      alert("Network error");
    } finally {
      setActing(null);
    }
  }

  const pending = payments.filter((p) => p.status === "pending");
  const shown = filter === "pending" ? pending : payments;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pending.length > 0
                ? `${pending.length} payment${pending.length === 1 ? "" : "s"} waiting for you`
                : "Nothing waiting — you're all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending ({pending.length})
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({payments.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={load} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="me-2 h-5 w-5 animate-spin" />
            Loading payments…
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border py-20 text-center">
            <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium">
              {filter === "pending" ? "No payments waiting" : "No payments yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Manual payments appear here for approval.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {shown.map((p) => (
              <Card key={p.id} className={p.status === "pending" ? "border-primary/40" : ""}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {p.user?.name || p.user?.email || p.userId.slice(0, 12)}
                      </span>
                      <StatusBadge status={p.status} />
                      <Badge variant="secondary" className="text-xs">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </Badge>
                    </div>

                    {p.user?.email && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.user.email}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      <span>
                        <strong>${p.amount}</strong> for <strong>{p.credits}</strong> credit
                        {p.credits > 1 ? "s" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        balance now: {p.user?.reviewCredits ?? "?"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(p.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {p.reference && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Reference:</span>{" "}
                        <code className="font-mono">{p.reference}</code>
                      </p>
                    )}
                    {p.userNote && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Note: &ldquo;{p.userNote}&rdquo;
                      </p>
                    )}
                    {p.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">Rejected: {p.rejectionReason}</p>
                    )}
                    {p.reviewedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reviewed by {p.reviewedBy}
                        {p.reviewedAt && ` · ${new Date(p.reviewedAt).toLocaleString()}`}
                      </p>
                    )}

                    {p.receiptSignedUrl ? (
                      <a
                        href={p.receiptSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View receipt
                      </a>
                    ) : (
                      p.method !== "stripe" && (
                        <p className="mt-3 text-sm text-amber-600">No receipt uploaded</p>
                      )
                    )}
                  </div>

                  {p.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" disabled={acting === p.id} onClick={() => act(p.id, "approve")}>
                        {acting === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="me-1.5 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting === p.id}
                        onClick={() => act(p.id, "reject")}
                      >
                        <XCircle className="me-1.5 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  // Variant names must exist in src/components/ui/badge.tsx — unmapped values
  // silently fall back to the default colour rather than erroring.
  const map: Record<string, { label: string; variant: string }> = {
    pending: { label: "Pending", variant: "yellow" },
    approved: { label: "Approved", variant: "green" },
    rejected: { label: "Rejected", variant: "red" },
    refunded: { label: "Refunded", variant: "gray" },
  };
  const s = map[status] ?? { label: status, variant: "default" };
  return (
    <Badge variant={s.variant} className="text-xs">
      {s.label}
    </Badge>
  );
}
