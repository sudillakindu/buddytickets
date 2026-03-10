// app/(main)/dashboard/(system)/system-reports.tsx
"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ReceiptText,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSystemOrders, getSystemTransactions } from "@/lib/actions/system-payments";
import { getSystemPayouts, updatePayoutStatus } from "@/lib/actions/system-payouts";
import { getSystemRefunds, reviewRefund } from "@/lib/actions/system-refunds";
import type {
  SystemOrderRow,
  SystemTransactionRow,
  SystemPayoutRow,
  SystemRefundRow,
  PayoutStatus,
  RefundStatus,
} from "@/lib/types/system";
import type { PaymentStatus } from "@/lib/types/payment";
import { Toast } from "@/components/ui/toast";

const PAGE_SIZE = 10;

// ─── Sub-tab types ───────────────────────────────────────────────────────────

type ReportTab = "orders" | "transactions" | "payouts" | "refunds";

const REPORT_TABS: { label: string; value: ReportTab; icon: React.ElementType }[] = [
  { label: "Orders", value: "orders", icon: ReceiptText },
  { label: "Transactions", value: "transactions", icon: CreditCard },
  { label: "Payouts", value: "payouts", icon: Wallet },
  { label: "Refunds", value: "refunds", icon: DollarSign },
];

// ─── Status Badges ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-teal-100 text-teal-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (v: number) =>
  `LKR ${Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersPanel() {
  const [orders, setOrders] = useState<SystemOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemOrders(statusFilter, page, PAGE_SIZE);
      if (!cancelled) {
        setOrders(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s as "ALL" | PaymentStatus);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Order ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Event
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Payment
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <ReceiptText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No orders found.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.order_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {o.user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-primary font-medium">
                      {o.event?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(o.final_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.payment_source} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3 font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transactions Tab ────────────────────────────────────────────────────────

function TransactionsPanel() {
  const [txns, setTxns] = useState<SystemTransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemTransactions(page, PAGE_SIZE);
      if (!cancelled) {
        setTxns(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Transaction
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Order
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Gateway
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Ref
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No transactions found.
                    </p>
                  </td>
                </tr>
              ) : (
                txns.map((t) => (
                  <tr key={t.transaction_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.transaction_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.order_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.gateway} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)]">
                      {t.gateway_ref_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payouts Tab ─────────────────────────────────────────────────────────────

function PayoutsPanel() {
  const [payouts, setPayouts] = useState<SystemPayoutRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | PayoutStatus>("ALL");
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemPayouts(statusFilter, page, PAGE_SIZE);
      if (!cancelled) {
        setPayouts(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  async function handleMarkCompleted(payoutId: string) {
    setUpdating(payoutId);
    const res = await updatePayoutStatus(payoutId, "COMPLETED");
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      setPayouts((prev) =>
        prev.map((p) => (p.payout_id === payoutId ? { ...p, status: "COMPLETED" as const } : p)),
      );
    }
    setUpdating(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s as "ALL" | PayoutStatus);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Event
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Organizer
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Gross
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Fee
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Net Payout
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No payouts found.
                    </p>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.payout_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-primary font-medium">
                      {p.event?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {p.organizer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(p.gross_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      {formatCurrency(p.platform_fee_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(p.net_payout_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating === p.payout_id}
                          onClick={() => handleMarkCompleted(p.payout_id)}
                        >
                          {updating === p.payout_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Complete"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Refunds Tab ─────────────────────────────────────────────────────────────

function RefundsPanel() {
  const [refunds, setRefunds] = useState<SystemRefundRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | RefundStatus>("ALL");
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<SystemRefundRow | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemRefunds(statusFilter, page, PAGE_SIZE);
      if (!cancelled) {
        setRefunds(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  async function handleReview(action: "APPROVED" | "REJECTED") {
    if (!reviewTarget) return;
    if (!adminNote.trim()) {
      Toast("Error", "Admin note is required.", "error");
      return;
    }
    setActionLoading(true);
    const res = await reviewRefund(reviewTarget.refund_id, action, adminNote);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      setRefunds((prev) =>
        prev.map((r) =>
          r.refund_id === reviewTarget.refund_id ? { ...r, status: action } : r,
        ),
      );
      setReviewTarget(null);
      setAdminNote("");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "REFUNDED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s as "ALL" | RefundStatus);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Reason
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Date
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No refund requests found.
                    </p>
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.refund_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {r.user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)] max-w-[200px] truncate">
                      {r.reason}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(r.refund_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewTarget(r)}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Review Refund
              </h3>
              <button
                onClick={() => {
                  setReviewTarget(null);
                  setAdminNote("");
                }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">User: </span>
                  <span className="font-medium">{reviewTarget.user?.name}</span>
                </p>
                <p>
                  <span className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Amount: </span>
                  <span className="font-mono font-medium">{formatCurrency(reviewTarget.refund_amount)}</span>
                </p>
                <p>
                  <span className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Reason: </span>
                  <span>{reviewTarget.reason}</span>
                </p>
              </div>
              <div>
                <Input
                  placeholder="Admin note (required)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReview("APPROVED")}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("REJECTED")}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Reports Component ──────────────────────────────────────────────────

export function SystemReports() {
  const [tab, setTab] = useState<ReportTab>("orders");

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "orders" && <OrdersPanel />}
      {tab === "transactions" && <TransactionsPanel />}
      {tab === "payouts" && <PayoutsPanel />}
      {tab === "refunds" && <RefundsPanel />}
    </div>
  );
}
