// Magic-byte sniffer — accepts genuine PDF/PNG/JPEG headers and rejects
// anything else (including a "PDF-with-fake-header" attempt and a
// near-miss FF-D8-?? that isn't 0xFF in byte 2).
import { describe, expect, it } from 'vitest';
import { sniffMime } from '../sniff';

function buf(...bytes: number[]): Buffer {
  return Buffer.from(bytes);
}

describe('sniffMime', () => {
  it('detects PDF (%PDF)', () => {
    expect(sniffMime(buf(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37))).toBe(
      'application/pdf',
    );
  });

  it('detects PNG (89 50 4E 47 ...)', () => {
    expect(
      sniffMime(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('image/png');
  });

  it('detects JPEG (FF D8 FF E0 — JFIF)', () => {
    expect(sniffMime(buf(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toBe(
      'image/jpeg',
    );
  });

  it('detects JPEG (FF D8 FF E1 — EXIF)', () => {
    expect(sniffMime(buf(0xff, 0xd8, 0xff, 0xe1, 0x12, 0x34))).toBe(
      'image/jpeg',
    );
  });

  it('rejects buffers shorter than 4 bytes', () => {
    expect(sniffMime(buf(0x25, 0x50, 0x44))).toBeNull();
  });

  it('rejects DOCX zip header (PK..)', () => {
    expect(sniffMime(buf(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00))).toBeNull();
  });

  it('rejects HTML (<!doctype...) masquerading as PDF', () => {
    expect(sniffMime(buf(0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54))).toBeNull();
  });

  it('rejects near-miss JPEG where third byte is not 0xFF', () => {
    expect(sniffMime(buf(0xff, 0xd8, 0xab, 0xcd))).toBeNull();
  });

  it('rejects empty buffer', () => {
    expect(sniffMime(Buffer.alloc(0))).toBeNull();
  });

  it('rejects all-zero buffer', () => {
    expect(sniffMime(Buffer.alloc(8))).toBeNull();
  });
});
