"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, User } from "lucide-react";
import type { EventCommunity } from "@/lib/types/event-community";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export interface EventCommunityListProps {
  members: (EventCommunity & { user_name?: string })[];
}

export const EventCommunityList: React.FC<EventCommunityListProps> = memo(
  ({ members }) => {
    if (members.length === 0) {
      return (
        <div className="p-8 text-center">
          <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-secondary text-sm text-gray-400">
            No team members assigned to this event yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-[hsl(270,70%,50%)]" />
          <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            Event Team
          </h3>
        </div>

        <div className="space-y-2">
          {members.map((member, index) => (
            <motion.div
              key={`${member.event_id}-${member.user_id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[hsl(270,70%,50%)]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[hsl(270,70%,50%)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
                    {member.user_name ?? member.user_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="font-secondary text-xs text-gray-400">
                  Assigned {formatDate(member.assigned_at)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  },
);

EventCommunityList.displayName = "EventCommunityList";
