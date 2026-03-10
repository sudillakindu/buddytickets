// app/(main)/dashboard/(system)/system-organizers.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  UserX,
  Eye,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOrganizers,
  approveOrganizer,
  rejectOrganizer,
  suspendOrganizer,
  reactivateOrganizer,
} from "@/lib/actions/system-organizers";
import type { SystemOrganizerRow, OrganizerVerifyStatus } from "@/lib/types/system";
import { Toast } from "@/components/ui/toast";

const STATUS_FILTERS: { label: string; value: "ALL" | OrganizerVerifyStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 10;

// ─── Detail Modal ────────────────────────────────────────────────────────────

function OrganizerDetailModal({
  organizer,
  onClose,
  onAction,
}: {
  organizer: SystemOrganizerRow;
  onClose: () => void;
  onAction: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const od = organizer.organizer_details;

  async function handleApprove() {
    setActionLoading(true);
    const res = await approveOrganizer(organizer.user_id);
    setActionLoading(false);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      onAction();
      onClose();
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      Toast("Error", "Please provide a rejection reason.", "error");
      return;
    }
    setActionLoading(true);
    const res = await rejectOrganizer(organizer.user_id, rejectReason);
    setActionLoading(false);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      onAction();
      onClose();
    }
  }

  async function handleSuspend() {
    setActionLoading(true);
    const res = await suspendOrganizer(organizer.user_id);
    setActionLoading(false);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      onAction();
      onClose();
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    const res = await reactivateOrganizer(organizer.user_id);
    setActionLoading(false);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      onAction();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            Organizer Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* User info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Name</p>
              <p className="font-primary font-medium">{organizer.name}</p>
            </div>
            <div>
              <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Email</p>
              <p className="font-primary font-medium">{organizer.email}</p>
            </div>
            <div>
              <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Mobile</p>
              <p className="font-primary font-medium">{organizer.mobile}</p>
            </div>
            <div>
              <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Status</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${organizer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {organizer.is_active ? "Active" : "Suspended"}
              </span>
            </div>
          </div>

          {od && (
            <>
              <hr className="border-gray-200" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">NIC Number</p>
                  <p className="font-primary font-medium">{od.nic_number}</p>
                </div>
                <div>
                  <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Verification</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[od.status] ?? "bg-gray-100 text-gray-800"}`}
                  >
                    {od.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Address</p>
                  <p className="font-primary font-medium">{od.address}</p>
                </div>
                <div>
                  <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Bank</p>
                  <p className="font-primary font-medium">
                    {od.bank_name} — {od.bank_branch}
                  </p>
                </div>
                <div>
                  <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Account</p>
                  <p className="font-primary font-medium">
                    {od.account_holder_name} ({od.account_number})
                  </p>
                </div>
                {od.remarks && (
                  <div className="col-span-2">
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">Remarks</p>
                    <p className="font-primary font-medium text-red-600">{od.remarks}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {od.status === "PENDING" && (
                <div className="space-y-3 pt-2">
                  <hr className="border-gray-200" />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Rejection reason (required)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Suspend / Reactivate */}
          <hr className="border-gray-200" />
          <div>
            {organizer.is_active ? (
              <Button
                variant="outline"
                onClick={handleSuspend}
                disabled={actionLoading}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <ShieldOff className="h-4 w-4" /> Suspend Organizer
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleReactivate}
                disabled={actionLoading}
                className="w-full text-green-600 border-green-200 hover:bg-green-50"
              >
                <Shield className="h-4 w-4" /> Reactivate Organizer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SystemOrganizers() {
  const [organizers, setOrganizers] = useState<SystemOrganizerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | OrganizerVerifyStatus>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SystemOrganizerRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getOrganizers(filter, page, PAGE_SIZE);
    setOrganizers(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getOrganizers(filter, page, PAGE_SIZE);
      if (!cancelled) {
        setOrganizers(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [filter, page]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Verification
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Account
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
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : organizers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No organizers found.
                    </p>
                  </td>
                </tr>
              ) : (
                organizers.map((org) => (
                  <tr key={org.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-primary font-medium">
                      {org.name}
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {org.email}
                    </td>
                    <td className="px-4 py-3">
                      {org.organizer_details ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[org.organizer_details.status] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {org.organizer_details.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not submitted</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${org.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {org.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(org)}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <OrganizerDetailModal
          organizer={selected}
          onClose={() => setSelected(null)}
          onAction={load}
        />
      )}
    </div>
  );
}
