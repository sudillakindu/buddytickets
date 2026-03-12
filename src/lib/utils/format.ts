// lib/utils/format.ts
// Shared formatting utilities for dates, times, and currency.

export const formatFullDate = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

export const formatTime = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const formatShortDateTime = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatSaleEnd = (saleEndAt: string | null, eventEndAt: string): string => {
  const src = saleEndAt ?? eventEndAt;
  return new Date(src).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatSaleEndParts = (
  saleEndAt: string | null,
  eventEndAt: string,
): { date: string; time: string } => {
  const source = saleEndAt ?? eventEndAt;
  const date = new Date(source).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = new Date(source).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
};

export const formatLKR = (amount: number, fractionDigits?: number): string => {
  if (amount === 0) return "Free";
  return fractionDigits !== undefined
    ? `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`
    : `LKR ${amount.toLocaleString("en-US")}`;
};

export const formatPrice = (price: number | null): string => {
  if (price === null) return "—";
  return formatLKR(price);
};
