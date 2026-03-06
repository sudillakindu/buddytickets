// lib/utils/qrcode.ts
// QR hash generation using HMAC-SHA256.
// The hash encodes order+reservation+index — tamper-proof, verifiable at gate.
// Secret: QR_HMAC_SECRET env var (never exposed to client).
//
// Gate scanner flow:
//   1. Scan QR → extract qr_hash
//   2. Query tickets WHERE qr_hash = X AND event_id = Y
//   3. Verify ticket.status = ACTIVE
//   4. Re-compute expected hash and compare (optional secondary check)

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

/**
 * Generate a cryptographically secure, unique QR hash for a single ticket.
 *
 * Payload structure: `orderId:reservationId:ticketIndex`
 * — orderId      : ties the hash to a specific confirmed order
 * — reservationId: ties the hash to a specific inventory reservation
 * — ticketIndex  : sequential (0-based) within the reservation (allows
 *                  multiple tickets per reservation to have distinct hashes)
 *
 * Returns a 64-char lowercase hex HMAC-SHA256 string.
 * This value is stored in tickets.qr_hash and is globally UNIQUE (enforced by DB).
 */
export function generateQRHash(
  orderId: string,
  reservationId: string,
  ticketIndex: number,
): string {
  const secret = getQRSecret();
  const payload = `${orderId}:${reservationId}:${ticketIndex}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Generate all QR hashes for a reservation.
 * Returns an array of `quantity` hashes, one per ticket seat.
 */
export function generateQRHashesForReservation(
  orderId: string,
  reservationId: string,
  quantity: number,
): string[] {
  return Array.from({ length: quantity }, (_, i) =>
    generateQRHash(orderId, reservationId, i),
  );
}

/**
 * Verify a QR hash for gate scanning.
 * Compares the presented hash against the expected hash using a timing-safe comparison.
 * Should ONLY be used server-side (e.g. gate scanning API route).
 */
export function verifyQRHash(
  presentedHash: string,
  orderId: string,
  reservationId: string,
  ticketIndex: number,
): boolean {
  try {
    const expected = generateQRHash(orderId, reservationId, ticketIndex);
    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(presentedHash, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}