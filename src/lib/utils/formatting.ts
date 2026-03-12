// lib/utils/formatting.ts
// Shared date, time, and currency formatting utilities.

export const formatDate = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "—";

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

export const formatPrice = (price: number | null): string => {
  if (price === null) return "—";
  if (price === 0) return "Free";
  return `LKR ${price.toLocaleString()}`;
};

export const formatLKR = (n: number): string =>
  n === 0
    ? "Free"
    : `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

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

export const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCheckoutDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
