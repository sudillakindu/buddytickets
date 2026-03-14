"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { ScanLine, ClipboardList } from "lucide-react";
import { TicketScanner } from "@/components/shared/scan-log/ticket-scanner";
import { ScanLogTable } from "@/components/shared/scan-log/scan-log-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { getScanLogsByEvent } from "@/lib/actions/scan-log";
import type { SessionUser } from "@/lib/utils/session";
import type { ScanLog } from "@/lib/types/scan-log";

const ScanLogSkeleton: React.FC = memo(() => (
  <div className="animate-pulse rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 space-y-3">
    <div className="h-4 w-full rounded bg-gray-200" />
    <div className="h-4 w-3/4 rounded bg-gray-100" />
    <div className="h-4 w-1/2 rounded bg-gray-100" />
  </div>
));

ScanLogSkeleton.displayName = "ScanLogSkeleton";

export function StaffDashboard({ user }: { user: SessionUser }) {
  const [eventId, setEventId] = useState("");
  const [activeEventId, setActiveEventId] = useState("");
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = useCallback(async (eid: string) => {
    if (!eid) return;
    setIsLoading(true);
    try {
      const result = await getScanLogsByEvent(eid);
      if (result.success) {
        setLogs(result.logs ?? []);
      } else {
        Toast("Error", result.message, "error");
      }
    } catch (error) {
      logger.error({
        fn: "StaffDashboard.loadLogs",
        message: "Failed to load scan logs",
        meta: error,
      });
      Toast("Error", "Failed to load scan logs.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetEvent = useCallback(() => {
    if (!eventId.trim()) return;
    setActiveEventId(eventId.trim());
  }, [eventId]);

  useEffect(() => {
    if (activeEventId) loadLogs(activeEventId);
  }, [activeEventId, loadLogs]);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              Staff
            </span>{" "}
            Dashboard
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-3">
            Welcome back, {user.name}. Scan tickets and manage event entry.
          </p>
        </div>

        {/* --- Event Selector --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm mb-8"
        >
          <Label
            htmlFor="event-id"
            className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] mb-1.5 block"
          >
            Event ID
          </Label>
          <div className="flex gap-2">
            <Input
              id="event-id"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetEvent()}
              placeholder="Enter event ID to start scanning..."
              className="font-secondary text-sm border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-[hsl(270,70%,50%)]"
            />
            <Button
              onClick={handleSetEvent}
              disabled={!eventId.trim()}
              className="shrink-0 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] text-white hover:opacity-90 transition-opacity"
            >
              Set Event
            </Button>
          </div>
        </motion.div>

        {activeEventId && (
          <div className="space-y-8">
            {/* --- Ticket Scanner --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <TicketScanner eventId={activeEventId} />
            </motion.div>

            {/* --- Scan Logs --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="w-5 h-5 text-[hsl(270,70%,50%)]"
                    aria-hidden="true"
                  />
                  <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    Scan History
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLogs(activeEventId)}
                  className="font-secondary text-xs"
                >
                  Refresh
                </Button>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ScanLogSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <ScanLogTable logs={logs} />
              )}
            </motion.div>
          </div>
        )}

        {!activeEventId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <ScanLine
              className="w-16 h-16 text-[hsl(215.4,16.3%,46.9%)] opacity-50 mb-4"
              aria-hidden="true"
            />
            <h3 className="font-primary text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
              Ready to Scan
            </h3>
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] max-w-md">
              Enter an event ID above to start scanning tickets and managing
              event entry.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
