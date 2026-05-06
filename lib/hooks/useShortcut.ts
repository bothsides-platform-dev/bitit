'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

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
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const { meta, shift, preventInInput } = opts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isEscape = e.key === 'Escape';
      if (preventInInput !== false && isEditable(e.target) && !isEscape) return;
      if (!isEscape) {
        if (meta && !(e.metaKey || e.ctrlKey)) return;
        if (!meta && (e.metaKey || e.ctrlKey)) return;
      }
      if (shift !== undefined && shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      handlerRef.current(e);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key, meta, shift, preventInInput]);
}
