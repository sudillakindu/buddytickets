import type { EventStatus } from "@/lib/types";

export interface StatusPill {
  label: string;
  pillClass: string;
}

export const EVENT_STATUS_PILLS: Record<EventStatus, StatusPill> = {
  ON_SALE: {
    label: "On Sale",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  ONGOING: {
    label: "Live Now",
    pillClass: "bg-emerald-50 border-emerald-300 text-emerald-700",
  },
  PUBLISHED: {
    label: "Upcoming",
    pillClass: "bg-orange-50 border-orange-200 text-orange-700",
  },
  SOLD_OUT: {
    label: "Sold Out",
    pillClass: "bg-red-50 border-red-200 text-red-700",
  },
  COMPLETED: {
    label: "Completed",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelled",
    pillClass: "bg-gray-50 border-gray-200 text-gray-500",
  },
  DRAFT: {
    label: "Draft",
    pillClass: "bg-gray-50 border-gray-200 text-gray-400",
  },
};

export const FALLBACK_STATUS_PILL: StatusPill = {
  label: "Unknown",
  pillClass: "bg-gray-50 border-gray-200 text-gray-500",
};
