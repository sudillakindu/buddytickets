// app/(main)/dashboard/(system)/system-users.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSystemUsers, toggleUserActive } from "@/lib/actions/system-users";
import type { SystemUserRow, UserRole } from "@/lib/types/system";
import { Toast } from "@/components/ui/toast";

const ROLE_FILTERS: { label: string; value: "ALL" | UserRole }[] = [
  { label: "All", value: "ALL" },
  { label: "System", value: "SYSTEM" },
  { label: "Organizer", value: "ORGANIZER" },
  { label: "Staff", value: "STAFF" },
  { label: "User", value: "USER" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  SYSTEM: "bg-indigo-100 text-indigo-700",
  ORGANIZER: "bg-purple-100 text-purple-700",
  STAFF: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-700",
};

const PAGE_SIZE = 10;

export function SystemUsers() {
  const [users, setUsers] = useState<SystemUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | UserRole>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemUsers(filter, search, page, PAGE_SIZE);
      if (!cancelled) {
        setUsers(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [filter, search, page]);

  async function handleToggle(userId: string, current: boolean) {
    setToggling(userId);
    const res = await toggleUserActive(userId, !current);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, is_active: !current } : u)),
      );
    }
    setToggling(null);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
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
                  Role
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Joined
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-primary font-medium">{u.name}</p>
                        <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                          @{u.username}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "SYSTEM" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={toggling === u.user_id}
                          onClick={() => handleToggle(u.user_id, u.is_active)}
                          className={
                            u.is_active
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }
                        >
                          {toggling === u.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.is_active ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          {u.is_active ? "Suspend" : "Activate"}
                        </Button>
                      )}
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
    </div>
  );
}
