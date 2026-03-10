// app/(main)/dashboard/(system)/system-categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from "@/lib/actions/system_categories-actions";
import type { SystemCategory } from "@/lib/types/system";

export default function SystemCategoriesPage() {
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create / Edit modal
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    category?: SystemCategory;
  } | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getCategories();
      if (!cancelled) {
        if (result.success && result.data) {
          setCategories(result.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function openCreate() {
    setFormName("");
    setFormDesc("");
    setModal({ mode: "create" });
  }

  function openEdit(cat: SystemCategory) {
    setFormName(cat.name);
    setFormDesc(cat.description ?? "");
    setModal({ mode: "edit", category: cat });
  }

  async function handleSave() {
    if (!formName.trim()) {
      Toast("Error", "Category name is required.", "error");
      return;
    }
    setActionLoading(true);
    if (modal?.mode === "create") {
      const result = await createCategory(
        formName.trim(),
        formDesc.trim() || undefined,
      );
      if (result.success) {
        Toast("Created", result.message, "success");
        setModal(null);
        setRefreshKey((k) => k + 1);
      } else {
        Toast("Error", result.message, "error");
      }
    } else if (modal?.mode === "edit" && modal.category) {
      const result = await updateCategory(
        modal.category.category_id,
        formName.trim(),
        formDesc.trim() || undefined,
      );
      if (result.success) {
        Toast("Updated", result.message, "success");
        setModal(null);
        setRefreshKey((k) => k + 1);
      } else {
        Toast("Error", result.message, "error");
      }
    }
    setActionLoading(false);
  }

  async function handleToggleActive(cat: SystemCategory) {
    setActionLoading(true);
    const result = await toggleCategoryActive(cat.category_id);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Category Management
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Manage event categories
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New Category
        </Button>
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
                  Description
                </th>
                <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Active
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Events
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
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : categories.map((cat) => (
                    <tr
                      key={cat.category_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900 font-medium">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[250px] truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(cat)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cat.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${cat.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {cat.events_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(cat)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              {modal.mode === "create" ? "New Category" : "Edit Category"}
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Category name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description (optional)</Label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description…"
                  className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading || !formName.trim()}
                onClick={handleSave}
              >
                {actionLoading
                  ? "Saving…"
                  : modal.mode === "create"
                    ? "Create"
                    : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
