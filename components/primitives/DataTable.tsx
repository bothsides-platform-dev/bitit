'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

type DataTableProps<T extends RowData> = {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
};

export function DataTable<T extends RowData>({
  columns,
  data,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[var(--color-hair)]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2 text-left font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--color-ink-soft)] font-normal"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'group border-b border-[var(--color-hair)] transition-colors duration-[140ms]',
                onRowClick && 'cursor-pointer hover:bg-[var(--color-paper-warm)]',
              )}
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  key={cell.id}
                  className={cn(
                    'relative px-3 py-3 text-[13px] text-[var(--color-ink)]',
                    i === 0 &&
                      onRowClick &&
                      'group-hover:before:absolute group-hover:before:left-0 group-hover:before:top-0 group-hover:before:bottom-0 group-hover:before:w-2 group-hover:before:bg-[var(--color-ink)]',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--color-ink-faint)]"
              >
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
