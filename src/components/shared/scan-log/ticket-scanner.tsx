"use client";

import React, { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ScanLine,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanTicket } from "@/lib/actions/scan-log";
import type { ScanResult } from "@/lib/types/scan-log";

export interface TicketScannerProps {
  eventId: string;
}

interface ScanFeedback {
  success: boolean;
  message: string;
  result?: ScanResult;
}

export const TicketScanner: React.FC<TicketScannerProps> = memo(
  ({ eventId }) => {
    const [qrHash, setQrHash] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [feedback, setFeedback] = useState<ScanFeedback | null>(null);

    const handleScan = useCallback(async () => {
      if (!qrHash.trim()) return;
      setIsScanning(true);
      setFeedback(null);

      try {
        const result = await scanTicket(eventId, qrHash.trim());
        setFeedback({
          success: result.success,
          message: result.message,
          result: result.result,
        });
        if (result.success) setQrHash("");
      } catch {
        setFeedback({
          success: false,
          message: "Failed to scan ticket. Please try again.",
        });
      } finally {
        setIsScanning(false);
      }
    }, [eventId, qrHash]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleScan();
      },
      [handleScan],
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ScanLine
            className="w-5 h-5 text-[hsl(270,70%,50%)]"
            aria-hidden="true"
          />
          <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            Ticket Scanner
          </h3>
        </div>

        <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm">
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="qr-hash"
                className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)]"
              >
                QR Code / Ticket Hash
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="qr-hash"
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter or scan QR code..."
                  className="font-secondary text-sm border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-[hsl(270,70%,50%)]"
                  disabled={isScanning}
                />
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !qrHash.trim()}
                  className="shrink-0 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] text-white hover:opacity-90 transition-opacity"
                >
                  {isScanning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ScanLine className="w-4 h-4" />
                  )}
                  Scan
                </Button>
              </div>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  feedback.success
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200",
                )}
              >
                {feedback.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <p
                  className={cn(
                    "font-secondary text-sm",
                    feedback.success ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {feedback.message}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

TicketScanner.displayName = "TicketScanner";
