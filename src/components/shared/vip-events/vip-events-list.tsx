"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Crown, User, Calendar } from "lucide-react";
import type { VipEvent } from "@/lib/types/vip-event";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface VipEventsListProps {
  vipEvents: (VipEvent & { event_name?: string })[];
}

export const VipEventsList: React.FC<VipEventsListProps> = memo(
  ({ vipEvents }) => {
    if (vipEvents.length === 0) {
      return (
        <div className="p-8 text-center">
          <Crown className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-secondary text-sm text-gray-400">
            No VIP events assigned yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            VIP Events
          </h3>
        </div>

        <div className="space-y-3">
          {vipEvents.map((vip, index) => (
            <motion.div
              key={vip.event_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
                  {vip.event_name ?? vip.event_id}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-secondary text-xs text-amber-600">
                    Priority: #{vip.priority_order}
                  </span>
                  <span className="flex items-center gap-1 font-secondary text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    Assigned by: {vip.assigned_by}
                  </span>
                  <span className="flex items-center gap-1 font-secondary text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(vip.created_at)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  },
);

VipEventsList.displayName = "VipEventsList";
