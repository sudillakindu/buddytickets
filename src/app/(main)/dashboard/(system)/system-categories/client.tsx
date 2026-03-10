// app/(main)/dashboard/(system)/system-categories/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from "@/lib/actions/system-categories";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SystemCategory } from "@/lib/types/system";
import { Loader2, Plus, Pencil } from "lucide-react";

export function SystemCategoriesClient() {
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.success) {
      setCategories(result.categories);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getCategories();
      if (cancelled) return;
      if (result.success) {
        setCategories(result.categories);
      } else {
        Toast("Error", result.message, "error");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormName("");
    setFormDesc("");
  };

  const handleEdit = (cat: SystemCategory) => {
    setEditId(cat.category_id);
    setFormName(cat.name);
    setFormDesc(cat.description ?? "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const result = editId
      ? await updateCategory(editId, formName, formDesc)
      : await createCategory(formName, formDesc);

    if (result.success) {
      Toast("Success", result.message, "success");
      resetForm();
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
    setSaving(false);
  };

  const handleToggle = async (categoryId: string, current: boolean) => {
    const result = await toggleCategoryActive(categoryId, !current);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-primary text-3xl font-semibold text-gray-900">
            Categories
          </h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> New Category
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editId ? "Edit Category" : "New Category"}
            </h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <textarea
                  id="cat-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No categories</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.category_id}
                  className="flex items-center justify-between rounded-xl border bg-white px-6 py-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        cat.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={cat.is_active ? "destructive" : "default"}
                      onClick={() =>
                        handleToggle(cat.category_id, cat.is_active)
                      }
                    >
                      {cat.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
