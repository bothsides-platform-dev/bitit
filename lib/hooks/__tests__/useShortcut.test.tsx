import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShortcut } from '@/lib/hooks/useShortcut';

describe('useShortcut', () => {
  it('ignores keyboard events without a string key (synthetic / IME / Sentry-wrapped)', () => {
    const handler = vi.fn();
    renderHook(() => useShortcut('s', handler, { meta: true, preventInInput: false }));

    const errors: ErrorEvent[] = [];
    const onErr = (e: ErrorEvent) => errors.push(e);
    window.addEventListener('error', onErr);

    const ev = new Event('keydown') as unknown as KeyboardEvent & { metaKey: boolean };
    Object.defineProperty(ev, 'metaKey', { value: true });
    document.dispatchEvent(ev);

    window.removeEventListener('error', onErr);
    // jsdom routes uncaught listener throws to window 'error'. Without the
    // guard, e.key.toLowerCase() throws TypeError here.
    expect(errors).toHaveLength(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires the handler on a normal matching keydown', () => {
    const handler = vi.fn();
    renderHook(() => useShortcut('s', handler, { meta: true, preventInInput: false }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
