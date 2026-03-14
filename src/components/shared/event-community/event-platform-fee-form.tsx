"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EventPlatformFeeFormProps {
  initialFeeValue?: number | null;
  initialFeeCap?: number | null;
  onSave?: (data: {
    platform_fee_value: number | null;
    platform_fee_cap: number | null;
  }) => Promise<{ success: boolean; message: string }>;
}

export const EventPlatformFeeForm: React.FC<EventPlatformFeeFormProps> = memo(
  ({ initialFeeValue, initialFeeCap, onSave }) => {
    const [feeValue, setFeeValue] = useState(
      initialFeeValue?.toString() ?? "",
    );
    const [feeCap, setFeeCap] = useState(initialFeeCap?.toString() ?? "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onSave) return;
        setIsSaving(true);
        await onSave({
          platform_fee_value: feeValue ? parseFloat(feeValue) : null,
          platform_fee_cap: feeCap ? parseFloat(feeCap) : null,
        });
        setIsSaving(false);
      },
      [feeValue, feeCap, onSave],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[hsl(270,70%,50%)]" />
          <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            Platform Fee Settings
          </h4>
        </div>

        <p className="font-secondary text-xs text-gray-400">
          Configure platform fee percentage and cap for your events. These
          values determine the platform&apos;s share of ticket revenue.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="platform-fee-value"
                className="font-secondary text-xs text-gray-500"
              >
                Platform Fee (%)
              </Label>
              <Input
                id="platform-fee-value"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
                placeholder="e.g. 5"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
              <p className="font-secondary text-xs text-gray-300">
                Percentage of ticket revenue deducted as platform fee.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="platform-fee-cap"
                className="font-secondary text-xs text-gray-500"
              >
                Fee Cap (LKR)
              </Label>
              <Input
                id="platform-fee-cap"
                type="number"
                min={0}
                step={0.01}
                value={feeCap}
                onChange={(e) => setFeeCap(e.target.value)}
                placeholder="e.g. 5000"
                className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              />
              <p className="font-secondary text-xs text-gray-300">
                Maximum platform fee per event regardless of revenue. Leave
                empty for no cap.
              </p>
            </div>
          </div>

          {onSave && (
            <Button
              type="submit"
              disabled={isSaving}
              className={cn(
                "font-primary font-bold text-sm py-2.5 h-auto rounded-xl text-white shadow-sm transition-all",
                "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:shadow-md",
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Fee Settings"
              )}
            </Button>
          )}
        </form>
      </motion.div>
    );
  },
);

EventPlatformFeeForm.displayName = "EventPlatformFeeForm";
