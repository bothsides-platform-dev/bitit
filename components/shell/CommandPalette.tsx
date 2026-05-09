'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { Command } from 'cmdk';
import { XIcon } from '@/components/icons';
import { IconButton } from '@/components/primitives/IconButton';
import {
  searchBidsAction,
  type BidSearchItem,
} from '@/lib/server/actions/search/searchBidsAction';

type CommandItem = {
  group: string;
  id: string;
  label: string;
  shortcut?: string;
  href?: string;
};

const COMMANDS: CommandItem[] = [
  { group: 'RFQ', id: 'rfq-list', label: 'RFQ 목록', href: '/rfq' },
  { group: 'RFQ', id: 'rfq-new', label: '신규 견적 요청', shortcut: '⌘N', href: '/rfq/new' },
  { group: '수신함', id: 'inbox', label: '수신함', href: '/inbox' },
  { group: '설정', id: 'settings-profile', label: '프로필 설정', href: '/settings/profile' },
  { group: '설정', id: 'settings-members', label: '멤버 관리', href: '/settings/members' },
];

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();
  const router = useRouter();
  const [bidItems, setBidItems] = useState<BidSearchItem[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!commandPaletteOpen) {
      setBidItems([]);
      return;
    }
    setBidsLoading(true);
    searchBidsAction()
      .then(setBidItems)
      .catch(() => {})
      .finally(() => setBidsLoading(false));
  }, [commandPaletteOpen]);

  const groups = [...new Set(COMMANDS.map((c) => c.group))];

  return (
    <>
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(10,10,15,0.4)] backdrop-blur-[4px] pt-[12vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCommandPalette();
          }}
        >
          <div
            className="w-[620px] bg-[var(--color-paper)] border border-[var(--color-hair)] rounded-md overflow-hidden shadow-lg"
            style={{ boxShadow: '0 2px 8px rgba(10,10,15,0.08), 0 24px 64px -8px rgba(10,10,15,0.18)' }}
          >
            <Command>
              <div className="flex items-center border-b border-[var(--color-hair)] px-4">
                <Command.Input
                  className="flex-1 h-12 bg-transparent font-sans text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] outline-none"
                  placeholder="명령어 검색..."
                  autoFocus
                />
                <IconButton label="닫기" size="sm" onClick={closeCommandPalette}>
                  <XIcon size={14} />
                </IconButton>
              </div>
              <Command.List className="max-h-80 overflow-y-auto py-2">
                <Command.Empty className="py-8 text-center font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
                  결과 없음
                </Command.Empty>
                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={
                      <span className="px-4 py-1 block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
                        {group}
                      </span>
                    }
                  >
                    {COMMANDS.filter((c) => c.group === group).map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={() => {
                          if (cmd.href) router.push(cmd.href);
                          closeCommandPalette();
                        }}
                        className="flex items-center justify-between px-4 py-2.5 text-[13px] text-[var(--color-ink)] cursor-pointer aria-selected:bg-[var(--color-paper-warm)]"
                      >
                        <span>{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="font-mono text-[10px] text-[var(--color-ink-soft)]">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
                {(bidsLoading || bidItems.length > 0) && (
                  <Command.Group
                    heading={
                      <span className="px-4 py-1 block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--color-ink-soft)]">
                        견적서
                      </span>
                    }
                  >
                    {bidsLoading ? (
                      <Command.Loading>
                        <span className="px-4 py-3 block font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
                          LOADING…
                        </span>
                      </Command.Loading>
                    ) : (
                      bidItems.map((item) => (
                        <Command.Item
                          key={item.bidId}
                          value={[item.rfqTitle, item.pgWsName, item.memo].filter(Boolean).join(' ')}
                          onSelect={() => {
                            router.push(item.href);
                            closeCommandPalette();
                          }}
                          className="flex flex-col items-start gap-0.5 px-4 py-2.5 cursor-pointer aria-selected:bg-[var(--color-paper-warm)]"
                        >
                          <span className="text-[13px] text-[var(--color-ink)]">
                            {item.rfqTitle}
                            {item.pgWsName && (
                              <span className="ml-2 text-[var(--color-ink-soft)]">
                                {item.pgWsName}
                              </span>
                            )}
                          </span>
                          {item.memo && (
                            <span className="text-[11px] font-mono text-[var(--color-ink-soft)] truncate max-w-[540px]">
                              {item.memo}
                            </span>
                          )}
                        </Command.Item>
                      ))
                    )}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
