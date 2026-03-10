// app/(main)/dashboard/(system)/system-refunds/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import {
  getRefunds,
  approveRefund,
  rejectRefund,
} from "@/lib/actions/system_refunds-actions";
import type { SystemRefund, RefundStatus } from "@/lib/types/system";

const REFUND_STATUSES: RefundStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
];

function statusBadge(status: RefundStatus) {
  const map: Record<RefundStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    REFUNDED: "bg-blue-100 text-blue-800",
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

export default function SystemRefundsPage() {
  const [refunds, setRefunds] = useState<SystemRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<RefundStatus | "">("");

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<SystemRefund | null>(
    null,
  );
  const [gatewayRef, setGatewayRef] = useState("");

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<SystemRefund | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getRefunds(statusFilter || undefined);
      if (!cancelled) {
        if (result.success && result.data) {
          setRefunds(result.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  async function handleApprove() {
    if (!approveTarget) return;
    setActionLoading(true);
    const result = await approveRefund(
      approveTarget.refund_id,
      gatewayRef.trim() || undefined,
    );
    if (result.success) {
      Toast("Approved", result.message, "success");
      setApproveTarget(null);
      setGatewayRef("");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!rejectTarget || !adminNote.trim()) {
      Toast("Error", "Admin note is required for rejection.", "error");
      return;
    }
    setActionLoading(true);
    const result = await rejectRefund(
      rejectTarget.refund_id,
      adminNote.trim(),
    );
    if (result.success) {
      Toast("Rejected", result.message, "success");
      setRejectTarget(null);
      setAdminNote("");
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
          Refund Management
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Review and process refund requests
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as RefundStatus | "")
          }
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Statuses</option>
          {REFUND_STATUSES.map((s) => (
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
                  User
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Order Amount
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Refund
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Reason
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Source
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
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : refunds.map((r) => (
                    <tr
                      key={r.refund_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {r.user_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[150px] truncate">
                        {r.event_name}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-600 tabular-nums">
                        {formatCurrency(r.order_final_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-900 font-medium tabular-nums">
                        {formatCurrency(r.refund_amount)}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[150px] truncate">
                        {r.reason}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 text-xs">
                        {r.order_payment_source}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(r.status)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {r.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setApproveTarget(r)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setRejectTarget(r)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              {!loading && refunds.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No refund requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Approve Refund
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-1">
              Refund of{" "}
              <strong>{formatCurrency(approveTarget.refund_amount)}</strong> to{" "}
              <strong>{approveTarget.user_name}</strong>
            </p>
            <div className="mt-4">
              <label className="text-sm font-secondary text-gray-700">
                Gateway Refund Reference (optional)
              </label>
              <Input
                value={gatewayRef}
                onChange={(e) => setGatewayRef(e.target.value)}
                placeholder="Gateway reference…"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApproveTarget(null);
                  setGatewayRef("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleApprove}
              >
                {actionLoading ? "Approving…" : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Reject Refund
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-1">
              Rejecting refund for <strong>{rejectTarget.user_name}</strong>
            </p>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Reason for rejection (required)…"
              className="w-full mt-3 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary focus:outline-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setAdminNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading || !adminNote.trim()}
                onClick={handleReject}
              >
                {actionLoading ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
