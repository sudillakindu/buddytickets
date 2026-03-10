// app/(main)/dashboard/(system)/system-payouts/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getPayouts,
  processPayout,
  completePayout,
  failPayout,
} from "@/lib/actions/system-payouts";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SystemPayout, PayoutStatus } from "@/lib/types/system";
import { Loader2 } from "lucide-react";

const PAYOUT_STATUSES: PayoutStatus[] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

export function SystemPayoutsClient() {
  const [payouts, setPayouts] = useState<SystemPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "">("");
  const [bankRefs, setBankRefs] = useState<Record<string, string>>({});
  const [failRemarks, setFailRemarks] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const result = await getPayouts(statusFilter || undefined);
    if (result.success) {
      setPayouts(result.payouts);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getPayouts(statusFilter || undefined);
      if (cancelled) return;
      if (result.success) {
        setPayouts(result.payouts);
      } else {
        Toast("Error", result.message, "error");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const handleProcess = async (payoutId: string) => {
    const ref = bankRefs[payoutId];
    if (!ref?.trim()) {
      Toast("Error", "Bank transfer reference is required", "error");
      return;
    }
    const result = await processPayout(payoutId, ref);
    if (result.success) {
      Toast("Success", result.message, "success");
      setBankRefs((prev) => ({ ...prev, [payoutId]: "" }));
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleComplete = async (payoutId: string) => {
    const result = await completePayout(payoutId);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleFail = async (payoutId: string) => {
    const remarks = failRemarks[payoutId];
    if (!remarks?.trim()) {
      Toast("Error", "Remarks are required", "error");
      return;
    }
    const result = await failPayout(payoutId, remarks);
    if (result.success) {
      Toast("Success", result.message, "success");
      setFailRemarks((prev) => ({ ...prev, [payoutId]: "" }));
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const statusColor = (status: PayoutStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-primary text-3xl font-semibold text-gray-900">
          Payout Management
        </h1>

        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PayoutStatus | "")
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                    Event
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Organizer
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Gross Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Platform Fee
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Net Payout
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
                {payouts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No payouts found
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr
                      key={payout.payout_id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {payout.event_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payout.organizer_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(payout.gross_revenue).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {Number(payout.platform_fee_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {Number(payout.net_payout_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(payout.status)}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {payout.status === "PENDING" && (
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="Bank ref..."
                                value={bankRefs[payout.payout_id] ?? ""}
                                onChange={(e) =>
                                  setBankRefs((prev) => ({
                                    ...prev,
                                    [payout.payout_id]: e.target.value,
                                  }))
                                }
                                className="h-8 w-36"
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleProcess(payout.payout_id)
                                }
                              >
                                Process
                              </Button>
                            </div>
                          )}
                          {payout.status === "PROCESSING" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleComplete(payout.payout_id)
                              }
                            >
                              Complete
                            </Button>
                          )}
                          {payout.status !== "COMPLETED" &&
                            payout.status !== "FAILED" && (
                              <div className="flex gap-2 items-center">
                                <Input
                                  placeholder="Fail remarks..."
                                  value={
                                    failRemarks[payout.payout_id] ?? ""
                                  }
                                  onChange={(e) =>
                                    setFailRemarks((prev) => ({
                                      ...prev,
                                      [payout.payout_id]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-36"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleFail(payout.payout_id)
                                  }
                                >
                                  Fail
                                </Button>
                              </div>
                            )}
                          {payout.bank_transfer_ref && (
                            <p className="text-xs text-gray-400">
                              Ref: {payout.bank_transfer_ref}
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
