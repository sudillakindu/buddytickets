import crypto from "crypto";

let QR_SECRET: string | null = null;

function getQRSecret(): string {
  if (!QR_SECRET) {
    const s = process.env.QR_HMAC_SECRET;
    if (!s) throw new Error("Missing QR_HMAC_SECRET environment variable.");
    QR_SECRET = s;
  }
  return QR_SECRET;
}

export function generateQRHash(
  orderId: string,
  reservationId: string,
  ticketIndex: number,
): string {
  const secret = getQRSecret();
  const payload = `${orderId}:${reservationId}:${ticketIndex}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function generateQRHashesForReservation(
  orderId: string,
  reservationId: string,
  quantity: number,
): string[] {
  return Array.from({ length: quantity }, (_, i) =>
    generateQRHash(orderId, reservationId, i),
  );
}

export function verifyQRHash(
  presentedHash: string,
  orderId: string,
  reservationId: string,
  ticketIndex: number,
): boolean {
  try {
    const expected = generateQRHash(orderId, reservationId, ticketIndex);
    return crypto.timingSafeEqual(
      Buffer.from(presentedHash, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
