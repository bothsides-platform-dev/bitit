'use client';

import { useEffect } from 'react';

export type ShortcutOptions = {
  meta?: boolean; // ⌘ (mac) or Ctrl (win/linux)
  shift?: boolean;
  preventInInput?: boolean; // skip when focus is on input/textarea/contenteditable
};

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
};

export function useShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  opts: ShortcutOptions = {},
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (opts.preventInInput !== false && isEditable(e.target)) {
        if (e.key !== 'Escape') return;
      }
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return;
      if (!opts.meta && (e.metaKey || e.ctrlKey)) return;
      if (opts.shift !== undefined && opts.shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      handler(e);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key, handler, opts.meta, opts.shift, opts.preventInInput]);
}
