"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Tag, Loader2, User } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DiscountType } from "@/lib/types/checkout";

export interface PromotionFormData {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  min_order_amount: number;
  start_at: string;
  end_at: string;
  usage_limit_global: number;
  usage_limit_per_user: number;
  extra_rules_json: string;
}

export interface PromotionFormProps {
  createdBy?: string;
  initialData?: Partial<PromotionFormData>;
  onSubmit: (
    data: PromotionFormData,
  ) => Promise<{ success: boolean; message: string }>;
}

export const PromotionForm: React.FC<PromotionFormProps> = memo(
  ({ createdBy, initialData, onSubmit }) => {
    const [form, setForm] = useState<PromotionFormData>({
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
      discount_type: initialData?.discount_type ?? "PERCENTAGE",
      discount_value: initialData?.discount_value ?? 0,
      max_discount_cap: initialData?.max_discount_cap ?? null,
      min_order_amount: initialData?.min_order_amount ?? 0,
      start_at: initialData?.start_at ?? "",
      end_at: initialData?.end_at ?? "",
      usage_limit_global: initialData?.usage_limit_global ?? 0,
      usage_limit_per_user: initialData?.usage_limit_per_user ?? 1,
      extra_rules_json: initialData?.extra_rules_json ?? "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const update = useCallback(
      <K extends keyof PromotionFormData>(
        key: K,
        value: PromotionFormData[K],
      ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
      },
      [],
    );

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.extra_rules_json.trim()) {
          try {
            JSON.parse(form.extra_rules_json);
            setJsonError(null);
          } catch {
            setJsonError("Invalid JSON format. Please check your input.");
            return;
          }
        }
        setIsSubmitting(true);
        await onSubmit(form);
        setIsSubmitting(false);
      },
      [form, onSubmit],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[hsl(270,70%,50%)]" />
            <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Promotion
            </h4>
          </div>
          {createdBy && (
            <div className="flex items-center gap-1.5 text-xs font-secondary text-gray-400">
              <User className="w-3.5 h-3.5" />
              Created by: <span className="font-semibold text-gray-600">{createdBy}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Promo Code <span className="text-red-400">*</span>
              </Label>
              <Input
                required
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase())}
                placeholder="SUMMER2025"
                className="h-9 text-sm rounded-xl border-gray-200 uppercase tracking-wider focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
                maxLength={50}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Discount Type
              </Label>
              <div className="flex gap-2">
                {(["PERCENTAGE", "FIXED_AMOUNT"] as DiscountType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => update("discount_type", type)}
                      className={cn(
                        "flex-1 text-xs font-secondary font-semibold py-2 rounded-xl border transition-all",
                        form.discount_type === type
                          ? "border-[hsl(270,70%,50%)] bg-[hsl(270,70%,50%)]/5 text-[hsl(270,70%,50%)]"
                          : "border-gray-200 text-gray-400 hover:border-gray-300",
                      )}
                    >
                      {type === "PERCENTAGE" ? "Percentage (%)" : "Fixed (LKR)"}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Discount Value
              </Label>
              <Input
                type="number"
                min={0}
                step={form.discount_type === "PERCENTAGE" ? 1 : 0.01}
                value={form.discount_value || ""}
                onChange={(e) =>
                  update("discount_value", parseFloat(e.target.value) || 0)
                }
                placeholder={form.discount_type === "PERCENTAGE" ? "10" : "500"}
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Max Discount Cap (LKR)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.max_discount_cap ?? ""}
                onChange={(e) =>
                  update(
                    "max_discount_cap",
                    e.target.value ? parseFloat(e.target.value) : null,
                  )
                }
                placeholder="No cap"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Min Order Amount (LKR)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.min_order_amount || ""}
                onChange={(e) =>
                  update("min_order_amount", parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-secondary text-xs text-gray-500">
              Description
            </Label>
            <Input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Summer sale — 10% off all tickets"
              className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Start Date
              </Label>
              <Input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => update("start_at", e.target.value)}
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                End Date
              </Label>
              <Input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => update("end_at", e.target.value)}
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Global Usage Limit
              </Label>
              <Input
                type="number"
                min={0}
                value={form.usage_limit_global || ""}
                onChange={(e) =>
                  update("usage_limit_global", parseInt(e.target.value) || 0)
                }
                placeholder="0 = unlimited"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-secondary text-xs text-gray-500">
                Usage Limit Per User
              </Label>
              <Input
                type="number"
                min={0}
                value={form.usage_limit_per_user || ""}
                onChange={(e) =>
                  update("usage_limit_per_user", parseInt(e.target.value) || 0)
                }
                placeholder="1"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
            </div>
          </div>

          {/* --- Extra Rules JSON --- */}
          <div className="space-y-1.5">
            <Label className="font-secondary text-xs text-gray-500">
              Extra Rules (JSON)
            </Label>
            <Textarea
              value={form.extra_rules_json}
              onChange={(e) => {
                update("extra_rules_json", e.target.value);
                setJsonError(null);
              }}
              placeholder='{"min_tickets": 2, "vip_only": true}'
              className="text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)] min-h-[80px] font-mono text-xs"
              maxLength={5000}
            />
            {jsonError && (
              <p className="font-secondary text-xs text-red-500">{jsonError}</p>
            )}
            <p className="font-secondary text-xs text-gray-300">
              Optional JSON object for custom promotion rules.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!form.code.trim() || isSubmitting}
            className={cn(
              "w-full font-primary font-bold text-sm py-2.5 h-auto rounded-xl text-white shadow-sm transition-all",
              form.code.trim()
                ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:shadow-md"
                : "bg-gray-300",
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Promotion"
            )}
          </Button>
        </form>
      </motion.div>
    );
  },
);

PromotionForm.displayName = "PromotionForm";
