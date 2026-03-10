// app/(main)/dashboard/(system)/system-users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import {
  getUsers,
  toggleUserActive,
  changeUserRole,
} from "@/lib/actions/system_users-actions";
import type { SystemUser, UserRole } from "@/lib/types/system";

const ROLES: UserRole[] = ["SYSTEM", "ORGANIZER", "STAFF", "USER"];

function roleBadge(role: UserRole) {
  const map: Record<UserRole, string> = {
    SYSTEM: "bg-red-100 text-red-800",
    ORGANIZER: "bg-purple-100 text-purple-800",
    STAFF: "bg-blue-100 text-blue-800",
    USER: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[role]}`}
    >
      {role}
    </span>
  );
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // Role change modal
  const [roleModal, setRoleModal] = useState<{
    user: SystemUser;
    newRole: UserRole;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const perPage = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getUsers({
        role: roleFilter || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
        search: search || undefined,
        page,
        per_page: perPage,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setUsers(result.data);
          setTotalCount(result.total_count ?? 0);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [roleFilter, activeFilter, search, page, refreshKey]);

  async function handleToggleActive(userId: string) {
    setActionLoading(true);
    const result = await toggleUserActive(userId);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleConfirmRoleChange() {
    if (!roleModal) return;
    setActionLoading(true);
    const result = await changeUserRole(roleModal.user.user_id, roleModal.newRole);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRoleModal(null);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          User Management
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          View and manage all platform users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search name, email, username…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 w-64"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | "");
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">Active &amp; Inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Email
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Role
                </th>
                <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Active
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Created
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Last Login
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((u) => (
                    <tr
                      key={u.user_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[200px] truncate">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(u.user_id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${u.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            setRoleModal({
                              user: u,
                              newRole: e.target.value as UserRole,
                            })
                          }
                          className="h-8 rounded border border-gray-200 px-2 text-xs font-secondary bg-white"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs font-secondary text-gray-500">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-1">
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

      {/* Role Change Confirmation Modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Confirm Role Change
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-2">
              Change <strong>{roleModal.user.name}</strong>&apos;s role from{" "}
              <strong>{roleModal.user.role}</strong> to{" "}
              <strong>{roleModal.newRole}</strong>?
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModal(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmRoleChange}
              >
                {actionLoading ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
