"use client";

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Input } from "@/components/ui/input";
import type { AttendeeInfo } from "@/lib/types/checkout";

interface AttendeeFormProps {
  lineItems: Array<{
    ticket_type_id: string;
    ticket_type_name: string;
    quantity: number;
  }>;
  attendees: AttendeeInfo[];
  onChange: (attendees: AttendeeInfo[]) => void;
}

export const AttendeeForm: React.FC<AttendeeFormProps> = memo(
  ({ lineItems, attendees, onChange }) => {
    const [expandedSections, setExpandedSections] = useState<
      Record<string, boolean>
    >(() =>
      Object.fromEntries(lineItems.map((li) => [li.ticket_type_id, true])),
    );

    const toggleSection = useCallback((id: string) => {
      setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleFieldChange = useCallback(
      (
        flatIndex: number,
        field: keyof AttendeeInfo,
        value: string,
      ) => {
        const updated = attendees.map((a, i) =>
          i === flatIndex ? { ...a, [field]: value } : a,
        );
        onChange(updated);
      },
      [attendees, onChange],
    );

    // Compute starting index in the flat attendees array for each line item
    let runningIndex = 0;

    return (
      <div className="space-y-4">
        {lineItems.map((item) => {
          const startIndex = runningIndex;
          runningIndex += item.quantity;
          const isExpanded = expandedSections[item.ticket_type_id] ?? true;

          return (
            <div
              key={item.ticket_type_id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(item.ticket_type_id)}
                className={cn(
                  "flex w-full items-center justify-between px-5 py-3.5",
                  "hover:bg-gray-50/60 transition-colors cursor-pointer",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-primary font-black text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
                    {item.ticket_type_name}
                  </span>
                  <span className="font-secondary text-xs text-gray-400">
                    × {item.quantity}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Collapsible content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-4">
                      {Array.from({ length: item.quantity }, (_, qi) => {
                        const flatIdx = startIndex + qi;
                        const attendee = attendees[flatIdx] ?? {
                          attendee_name: "",
                          attendee_nic: "",
                          attendee_email: "",
                          attendee_mobile: "",
                        };

                        return (
                          <AttendeeTicketFields
                            key={`${item.ticket_type_id}-${qi}`}
                            label={`Ticket ${qi + 1}`}
                            attendee={attendee}
                            onChange={(field, value) =>
                              handleFieldChange(flatIdx, field, value)
                            }
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  },
);

AttendeeForm.displayName = "AttendeeForm";

/* ── Sub-component for a single ticket's fields ── */

interface AttendeeTicketFieldsProps {
  label: string;
  attendee: AttendeeInfo;
  onChange: (field: keyof AttendeeInfo, value: string) => void;
}

const AttendeeTicketFields: React.FC<AttendeeTicketFieldsProps> = memo(
  ({ label, attendee, onChange }) => (
    <div className="space-y-2.5">
      <p className="font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <FieldGroup label="Full Name" required>
          <Input
            placeholder="Full Name"
            value={attendee.attendee_name}
            onChange={(e) => onChange("attendee_name", e.target.value)}
            required
            className="font-secondary text-sm"
          />
        </FieldGroup>

        <FieldGroup label="NIC / ID Number" required>
          <Input
            placeholder="NIC / ID Number"
            value={attendee.attendee_nic}
            onChange={(e) => onChange("attendee_nic", e.target.value)}
            required
            className="font-secondary text-sm"
          />
        </FieldGroup>

        <FieldGroup label="Email (optional)">
          <Input
            type="email"
            placeholder="Email (optional)"
            value={attendee.attendee_email ?? ""}
            onChange={(e) => onChange("attendee_email", e.target.value)}
            className="font-secondary text-sm"
          />
        </FieldGroup>

        <FieldGroup label="Mobile (optional)">
          <Input
            type="tel"
            placeholder="Mobile (optional)"
            value={attendee.attendee_mobile ?? ""}
            onChange={(e) => onChange("attendee_mobile", e.target.value)}
            className="font-secondary text-sm"
          />
        </FieldGroup>
      </div>
    </div>
  ),
);

AttendeeTicketFields.displayName = "AttendeeTicketFields";

/* ── Tiny label wrapper ── */

const FieldGroup: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="font-secondary text-xs text-gray-500">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
