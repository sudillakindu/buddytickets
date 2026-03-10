// app/(main)/dashboard/(system)/system-payouts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import {
  getPayouts,
  markPayoutProcessing,
  markPayoutCompleted,
  markPayoutFailed,
} from "@/lib/actions/system_payouts-actions";
import type { SystemPayout, PayoutStatus } from "@/lib/types/system";

const PAYOUT_STATUSES: PayoutStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

function statusBadge(status: PayoutStatus) {
  const map: Record<PayoutStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SystemPayoutsPage() {
  const [payouts, setPayouts] = useState<SystemPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "">("");

  // Processing modal
  const [processingTarget, setProcessingTarget] =
    useState<SystemPayout | null>(null);
  const [bankRef, setBankRef] = useState("");

  // Fail modal
  const [failTarget, setFailTarget] = useState<SystemPayout | null>(null);
  const [failRemarks, setFailRemarks] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getPayouts(statusFilter || undefined);
      if (!cancelled) {
        if (result.success && result.data) {
          setPayouts(result.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  async function handleMarkProcessing() {
    if (!processingTarget || !bankRef.trim()) {
      Toast("Error", "Bank transfer reference is required.", "error");
      return;
    }
    setActionLoading(true);
    const result = await markPayoutProcessing(
      processingTarget.payout_id,
      bankRef.trim(),
    );
    if (result.success) {
      Toast("Updated", result.message, "success");
      setProcessingTarget(null);
      setBankRef("");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleMarkCompleted(payoutId: string) {
    setActionLoading(true);
    const result = await markPayoutCompleted(payoutId);
    if (result.success) {
      Toast("Completed", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleMarkFailed() {
    if (!failTarget || !failRemarks.trim()) {
      Toast("Error", "Remarks are required.", "error");
      return;
    }
    setActionLoading(true);
    const result = await markPayoutFailed(
      failTarget.payout_id,
      failRemarks.trim(),
    );
    if (result.success) {
      Toast("Updated", result.message, "success");
      setFailTarget(null);
      setFailRemarks("");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Payouts Management
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Process organizer payouts
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as PayoutStatus | "")
          }
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Statuses</option>
          {PAYOUT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Organizer
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Gross
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Fee
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Net Payout
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : payouts.map((p) => (
                    <tr
                      key={p.payout_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {p.organizer_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[180px] truncate">
                        {p.event_name}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {formatCurrency(p.gross_revenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-500 tabular-nums">
                        {formatCurrency(p.platform_fee_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-900 font-medium tabular-nums">
                        {formatCurrency(p.net_payout_amount)}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(p.status)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {p.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setProcessingTarget(p)}
                            >
                              Process
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setFailTarget(p)}
                            >
                              Fail
                            </Button>
                          </>
                        )}
                        {p.status === "PROCESSING" && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() =>
                                handleMarkCompleted(p.payout_id)
                              }
                            >
                              Complete
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setFailTarget(p)}
                            >
                              Fail
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              {!loading && payouts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No payouts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Processing Modal */}
      {processingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Mark as Processing
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-1">
              Payout to <strong>{processingTarget.organizer_name}</strong> for{" "}
              <strong>{processingTarget.event_name}</strong>
            </p>
            <div className="mt-4">
              <label className="text-sm font-secondary text-gray-700">
                Bank Transfer Reference
              </label>
              <Input
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="Transfer reference number…"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProcessingTarget(null);
                  setBankRef("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading || !bankRef.trim()}
                onClick={handleMarkProcessing}
              >
                {actionLoading ? "Saving…" : "Mark Processing"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Modal */}
      {failTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Mark Payout as Failed
            </h3>
            <textarea
              rows={3}
              value={failRemarks}
              onChange={(e) => setFailRemarks(e.target.value)}
              placeholder="Reason for failure (required)…"
              className="w-full mt-3 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary focus:outline-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFailTarget(null);
                  setFailRemarks("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading || !failRemarks.trim()}
                onClick={handleMarkFailed}
              >
                {actionLoading ? "Saving…" : "Mark Failed"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
