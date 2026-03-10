// app/(main)/dashboard/(system)/system-promotions/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  togglePromotionActive,
} from "@/lib/actions/system-promotions";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SystemPromotion, DiscountType } from "@/lib/types/system";
import { Loader2, Plus, Pencil } from "lucide-react";

interface PromoFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  usage_limit_global: number;
}

const DEFAULT_FORM: PromoFormData = {
  code: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: 0,
  start_at: "",
  end_at: "",
  usage_limit_global: 0,
};

export function SystemPromotionsClient() {
  const [promotions, setPromotions] = useState<SystemPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const result = await getPromotions();
    if (result.success) {
      setPromotions(result.promotions);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getPromotions();
      if (cancelled) return;
      if (result.success) {
        setPromotions(result.promotions);
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
    setForm(DEFAULT_FORM);
  };

  const handleEdit = (promo: SystemPromotion) => {
    setEditId(promo.promotion_id);
    setForm({
      code: promo.code,
      description: promo.description ?? "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      start_at: promo.start_at.slice(0, 16),
      end_at: promo.end_at.slice(0, 16),
      usage_limit_global: promo.usage_limit_global,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const result = editId
      ? await updatePromotion(editId, form)
      : await createPromotion(form);

    if (result.success) {
      Toast("Success", result.message, "success");
      resetForm();
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const result = await togglePromotionActive(id, !current);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-primary text-3xl font-semibold text-gray-900">
            Promotions
          </h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> New Promotion
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editId ? "Edit Promotion" : "New Promotion"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  placeholder="e.g. WELCOME20"
                />
              </div>
              <div>
                <Label htmlFor="promo-desc">Description</Label>
                <Input
                  id="promo-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label htmlFor="promo-type">Discount Type</Label>
                <select
                  id="promo-type"
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_type: e.target.value as DiscountType,
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                </select>
              </div>
              <div>
                <Label htmlFor="promo-value">Discount Value</Label>
                <Input
                  id="promo-value"
                  type="number"
                  value={form.discount_value || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_value: Number(e.target.value),
                    })
                  }
                  placeholder={
                    form.discount_type === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"
                  }
                />
              </div>
              <div>
                <Label htmlFor="promo-start">Start At</Label>
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm({ ...form, start_at: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="promo-end">End At</Label>
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) =>
                    setForm({ ...form, end_at: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="promo-limit">
                  Usage Limit (0 = unlimited)
                </Label>
                <Input
                  id="promo-limit"
                  type="number"
                  value={form.usage_limit_global}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usage_limit_global: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

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
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No promotions found
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr
                      key={promo.promotion_id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium font-mono text-gray-900">
                        {promo.code}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.discount_type}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.discount_type === "PERCENTAGE"
                          ? `${promo.discount_value}%`
                          : `LKR ${promo.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.current_global_usage}
                        {promo.usage_limit_global > 0
                          ? ` / ${promo.usage_limit_global}`
                          : " / ∞"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            promo.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {promo.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {promo.scope_event_id
                          ? "Event-specific"
                          : "Platform-wide"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(promo)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              promo.is_active ? "destructive" : "default"
                            }
                            onClick={() =>
                              handleToggle(
                                promo.promotion_id,
                                promo.is_active,
                              )
                            }
                          >
                            {promo.is_active ? "Deactivate" : "Activate"}
                          </Button>
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
