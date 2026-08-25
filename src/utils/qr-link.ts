/**
 * Generates the public-facing QR scan URL for a given event and QR code.
 *
 * QR links ALWAYS use the UUID v7 hash (urlHash), regardless of urlStrategy:
 *   - Slug is mutable → would break printed QR codes
 *   - Numeric ID is exploitable → security risk
 *   - UUID v7 is immutable, unique, and permanent
 *
 * @param urlHash - The event's UUID v7 hash (e.g. "019d6e60-6994-76f4-bcf0-d419fae7c5cf")
 * @param numericId - The QR code's numeric ID within the event
 * @param eventId - Fallback numeric event ID if urlHash is not available
 * @returns The full QR scan URL (e.g. "http://localhost:3000/e/{uuid}/qr/1")
 */
export function generateQrLink(
  urlHash: string | undefined,
  numericId: number,
  eventId?: number,
): string {
  // Priority: VITE_MEDIA_URL > VITE_API_URL (strip /api) > window.location.origin
  const rawBaseUrl =
    import.meta.env.VITE_MEDIA_URL ||
    import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ||
    window.location.origin;
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');

  if (urlHash) {
    return `${baseUrl}/e/${urlHash}/qr/${numericId}`;
  }

  // Fallback for legacy events without urlHash
  if (eventId) {
    return `${baseUrl}/e/${eventId}/qr/${numericId}`;
  }

  // Last resort: just use numeric ID without event context
  return `${baseUrl}/e/qr/${numericId}`;
}
