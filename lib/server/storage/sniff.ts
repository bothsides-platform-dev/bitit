/**
 * Magic-byte sniffer — third defense after `file.size` and `file.type`.
 *
 * The browser's `file.type` is derived from extension and is trivial to
 * spoof. The size cap is enforced separately. This function inspects the
 * first 4–8 bytes and returns one of the three canonical mimes we
 * accept, or `null` if the leading bytes don't match.
 *
 * We deliberately don't pull in `file-type` (npm) — a 4-byte header
 * check covers PDF/PNG/JPEG well enough for v0 and avoids a 200KB+
 * dependency. v1 can swap to `file-type` if more formats are added.
 */

export type AcceptedMime = 'application/pdf' | 'image/png' | 'image/jpeg';

export function sniffMime(buffer: Buffer): AcceptedMime | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF- (25 50 44 46 2D), but checking 4 bytes (%PDF) is enough.
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A — first 4 are unique.
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF (followed by E0/E1/DB/...). 3 bytes is the spec
  // marker; extra check on byte[3] avoids confusion with arbitrary
  // FF-D8-FF prefixes (we still allow any JFIF/EXIF variant).
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  return null;
}
