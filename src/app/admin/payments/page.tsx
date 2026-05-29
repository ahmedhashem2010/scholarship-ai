"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

interface Payment {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  email?: string;
  reviewCredits?: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState(1);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [payRes, userRes] = await Promise.all([
          fetch("/api/admin/payments"),
          fetch("/api/users"),
        ]);
        const payJson = await payRes.json();
        if (payJson.success) setPayments(payJson.data);
        const userJson = await userRes.json();
        if (userJson.success) setUsers(userJson.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addCredits() {
    if (!selectedUserId || creditAmount <= 0) return;
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, credits: creditAmount, amount: 0 }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Added ${creditAmount} credits!`);
        setCreditAmount(1);
      } else {
        setStatusMsg(json.error ?? "Failed");
      }
    } catch {
      setStatusMsg("Failed to add credits");
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Payments & Credits</h1>

        <div className="rounded-xl border bg-white p-6 mb-8">
          <h2 className="font-semibold mb-3">Manually Add Credits</h2>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-xs text-slate-500 block mb-1">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email ?? u.id} ({u.reviewCredits ?? 0} credits)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Credits</label>
              <input
                type="number"
                min={1}
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                className="rounded-md border px-3 py-2 text-sm w-20"
              />
            </div>
            <button
              onClick={addCredits}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Add Credits
            </button>
          </div>
          {statusMsg && <p className="text-sm text-green-600 mt-2">{statusMsg}</p>}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold mb-3">Recent Payments</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-2 pr-4">User ID</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Credits</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{p.userId.slice(0, 12)}...</td>
                      <td className="py-2 pr-4">${p.amount}</td>
                      <td className="py-2 pr-4">{p.credits}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${p.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
