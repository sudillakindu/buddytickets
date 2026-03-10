// app/(main)/dashboard/(system)/system-organizer-verification/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  getVerifications,
  approveOrganizer,
  rejectOrganizer,
} from "@/lib/actions/system_organizer-verification-actions";
import type {
  SystemOrganizerVerification,
  OrganizerStatus,
} from "@/lib/types/system";

const STATUS_OPTIONS: OrganizerStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function statusBadge(status: OrganizerStatus) {
  const map: Record<OrganizerStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function SystemOrganizerVerificationPage() {
  const [verifications, setVerifications] = useState<
    SystemOrganizerVerification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | "">("");
  const [actionLoading, setActionLoading] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState<SystemOrganizerVerification | null>(
    null,
  );

  // Reject modal
  const [rejectTarget, setRejectTarget] =
    useState<SystemOrganizerVerification | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getVerifications(statusFilter || undefined);
      if (!cancelled) {
        if (result.success && result.data) {
          setVerifications(result.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]);

  async function handleApprove(userId: string) {
    setActionLoading(true);
    const result = await approveOrganizer(userId);
    if (result.success) {
      Toast("Approved", result.message, "success");
      setRefreshKey((k) => k + 1);
      setDetail(null);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!rejectTarget || !rejectRemarks.trim()) {
      Toast("Error", "Remarks are required for rejection.", "error");
      return;
    }
    setActionLoading(true);
    const result = await rejectOrganizer(
      rejectTarget.user_id,
      rejectRemarks.trim(),
    );
    if (result.success) {
      Toast("Rejected", result.message, "success");
      setRejectTarget(null);
      setRejectRemarks("");
      setRefreshKey((k) => k + 1);
      setDetail(null);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Organizer Verification
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Review and approve organizer KYC submissions
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrganizerStatus | "")
          }
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
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
                  Email
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  NIC
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Submitted
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
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : verifications.map((v) => (
                    <tr
                      key={v.user_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {v.user_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[180px] truncate">
                        {v.user_email}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {v.nic_number}
                      </td>
                      <td className="px-4 py-3">{statusBadge(v.status)}</td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(v.created_at).toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetail(v)}
                        >
                          View
                        </Button>
                        {v.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => handleApprove(v.user_id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setRejectTarget(v)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              {!loading && verifications.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No verification requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900 mb-4">
              KYC Details — {detail.user_name}
            </h3>
            <div className="space-y-3 text-sm font-secondary">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900">{detail.user_email}</p>
                </div>
                <div>
                  <p className="text-gray-500">NIC Number</p>
                  <p className="text-gray-900">{detail.nic_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="text-gray-900">{detail.address}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bank</p>
                  <p className="text-gray-900">
                    {detail.bank_name} — {detail.bank_branch}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Account</p>
                  <p className="text-gray-900">
                    {detail.account_holder_name} ({detail.account_number})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-gray-500 mb-1">NIC Front</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.nic_front_image_url}
                    alt="NIC Front"
                    className="rounded-lg border border-gray-200 w-full h-auto"
                  />
                </div>
                <div>
                  <p className="text-gray-500 mb-1">NIC Back</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.nic_back_image_url}
                    alt="NIC Back"
                    className="rounded-lg border border-gray-200 w-full h-auto"
                  />
                </div>
              </div>
              {detail.remarks && (
                <div>
                  <p className="text-gray-500">Remarks</p>
                  <p className="text-gray-900">{detail.remarks}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Status</p>
                {statusBadge(detail.status)}
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetail(null)}
              >
                Close
              </Button>
              {detail.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleApprove(detail.user_id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => {
                      setRejectTarget(detail);
                      setDetail(null);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Reject Organizer
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-1">
              Provide a reason for rejecting{" "}
              <strong>{rejectTarget.user_name}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="Reason for rejection (required)…"
              className="w-full mt-3 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary focus:outline-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectRemarks("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading || !rejectRemarks.trim()}
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
