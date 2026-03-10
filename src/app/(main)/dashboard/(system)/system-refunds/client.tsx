// app/(main)/dashboard/(system)/system-refunds/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getRefunds,
  approveRefund,
  rejectRefund,
  markRefunded,
} from "@/lib/actions/system-refunds";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SystemRefund, RefundStatus } from "@/lib/types/system";
import { Loader2 } from "lucide-react";

const REFUND_STATUSES: RefundStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
];

export function SystemRefundsClient() {
  const [refunds, setRefunds] = useState<SystemRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "">("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [gatewayRefs, setGatewayRefs] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const result = await getRefunds(statusFilter || undefined);
    if (result.success) {
      setRefunds(result.refunds);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getRefunds(statusFilter || undefined);
      if (cancelled) return;
      if (result.success) {
        setRefunds(result.refunds);
      } else {
        Toast("Error", result.message, "error");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const handleApprove = async (refundId: string) => {
    const result = await approveRefund(refundId);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleReject = async (refundId: string) => {
    const note = adminNotes[refundId];
    if (!note?.trim()) {
      Toast("Error", "Admin note is required for rejection", "error");
      return;
    }
    const result = await rejectRefund(refundId, note);
    if (result.success) {
      Toast("Success", result.message, "success");
      setAdminNotes((prev) => ({ ...prev, [refundId]: "" }));
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleMarkRefunded = async (refundId: string) => {
    const ref = gatewayRefs[refundId];
    if (!ref?.trim()) {
      Toast("Error", "Gateway refund reference is required", "error");
      return;
    }
    const result = await markRefunded(refundId, ref);
    if (result.success) {
      Toast("Success", result.message, "success");
      setGatewayRefs((prev) => ({ ...prev, [refundId]: "" }));
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const statusColor = (status: RefundStatus) => {
    switch (status) {
      case "REFUNDED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "APPROVED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-primary text-3xl font-semibold text-gray-900">
          Refund Management
        </h1>

        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as RefundStatus | "")
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    User
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr
                      key={refund.refund_id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {refund.order_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {refund.user_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        LKR {Number(refund.refund_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {refund.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(refund.status)}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {refund.status === "PENDING" && (
                            <>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApprove(refund.refund_id)
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleReject(refund.refund_id)
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                              <Input
                                placeholder="Rejection note..."
                                value={
                                  adminNotes[refund.refund_id] ?? ""
                                }
                                onChange={(e) =>
                                  setAdminNotes((prev) => ({
                                    ...prev,
                                    [refund.refund_id]: e.target.value,
                                  }))
                                }
                                className="h-8"
                              />
                            </>
                          )}
                          {refund.status === "APPROVED" && (
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="Gateway ref..."
                                value={
                                  gatewayRefs[refund.refund_id] ?? ""
                                }
                                onChange={(e) =>
                                  setGatewayRefs((prev) => ({
                                    ...prev,
                                    [refund.refund_id]: e.target.value,
                                  }))
                                }
                                className="h-8 w-36"
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleMarkRefunded(refund.refund_id)
                                }
                              >
                                Mark Refunded
                              </Button>
                            </div>
                          )}
                          {refund.admin_note && (
                            <p className="text-xs text-gray-400">
                              Note: {refund.admin_note}
                            </p>
                          )}
                          {refund.gateway_refund_ref && (
                            <p className="text-xs text-gray-400">
                              Ref: {refund.gateway_refund_ref}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
