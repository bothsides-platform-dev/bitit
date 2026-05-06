'use client';

import { useEffect, useState } from 'react';

export type ListKeyHandlers = {
  onEnter?: (index: number) => void;
  onEdit?: (index: number) => void;
};

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

export function useListNavigation(length: number, handlers: ListKeyHandlers = {}) {
  const [stored, setStored] = useState(0);
  const active = length === 0 ? -1 : Math.min(stored, length - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setStored((i) => Math.min(length - 1, Math.max(0, i) + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setStored((i) => Math.max(0, Math.max(0, i) - 1));
      } else if (e.key === 'Enter') {
        if (active >= 0 && handlers.onEnter) {
          e.preventDefault();
          handlers.onEnter(active);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (active >= 0 && handlers.onEdit) {
          e.preventDefault();
          handlers.onEdit(active);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [length, active, handlers]);

  return { active, setActive: setStored };
}
