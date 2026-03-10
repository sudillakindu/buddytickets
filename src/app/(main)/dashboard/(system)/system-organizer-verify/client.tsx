// app/(main)/dashboard/(system)/system-organizer-verify/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getOrganizers,
  approveOrganizer,
  rejectOrganizer,
} from "@/lib/actions/system-organizer-verify";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { OrganizerVerifyItem } from "@/lib/types/system";
import type { OrganizerStatus } from "@/lib/types/organizer";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const TABS: OrganizerStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function OrganizerVerifyClient() {
  const [organizers, setOrganizers] = useState<OrganizerVerifyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrganizerStatus>("PENDING");
  const [rejectRemarks, setRejectRemarks] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const result = await getOrganizers(activeTab);
    if (result.success) {
      setOrganizers(result.organizers);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getOrganizers(activeTab);
      if (cancelled) return;
      if (result.success) {
        setOrganizers(result.organizers);
      } else {
        Toast("Error", result.message, "error");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleApprove = async (userId: string) => {
    const result = await approveOrganizer(userId);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleReject = async (userId: string) => {
    const remarks = rejectRemarks[userId];
    if (!remarks?.trim()) {
      Toast("Error", "Remarks are required for rejection", "error");
      return;
    }
    const result = await rejectOrganizer(userId, remarks);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRejectRemarks((prev) => ({ ...prev, [userId]: "" }));
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-primary text-3xl font-semibold text-gray-900">
          Organizer Verification
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : organizers.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            No {activeTab.toLowerCase()} organizers
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {organizers.map((org) => (
              <div
                key={org.user_id}
                className="rounded-xl border bg-white p-6 shadow-sm space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500">{org.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">NIC Number</p>
                    <p className="font-medium">{org.nic_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bank</p>
                    <p className="font-medium">
                      {org.bank_name} — {org.bank_branch}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account Holder</p>
                    <p className="font-medium">{org.account_holder_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account Number</p>
                    <p className="font-medium">{org.account_number}</p>
                  </div>
                </div>

                {/* NIC Images */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NIC Front</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={org.nic_front_image_url}
                      alt="NIC Front"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NIC Back</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={org.nic_back_image_url}
                      alt="NIC Back"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                </div>

                {org.remarks && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-500">Remarks</p>
                    <p className="text-gray-700">{org.remarks}</p>
                  </div>
                )}

                {/* Actions (only for PENDING) */}
                {activeTab === "PENDING" && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(org.user_id)}
                        className="gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(org.user_id)}
                        className="gap-1"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                    <textarea
                      placeholder="Rejection remarks (required to reject)..."
                      value={rejectRemarks[org.user_id] ?? ""}
                      onChange={(e) =>
                        setRejectRemarks((prev) => ({
                          ...prev,
                          [org.user_id]: e.target.value,
                        }))
                      }
                      className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
