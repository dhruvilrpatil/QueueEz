import React, { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';
import { ArrowDown, ArrowUp, HelpCircle } from 'lucide-react';
import type { SortDescriptor } from '@/types/react-aria';

// ── Table Context ─────────────────────────────────────────────
interface TableContextValue {
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectedKeys: Set<string>;
  toggleSelectAll: () => void;
  toggleSelectRow: (id: string) => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  totalRows: number;
}

const TableContext = createContext<TableContextValue | null>(null);

// ============================================================
// TABLE CARD
// ============================================================
export interface TableCardRootProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCardRoot({ children, className }: TableCardRootProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-hairline rounded-xl overflow-hidden shadow-2xs relative',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface TableCardHeaderProps {
  title: string;
  badge?: string;
  contentTrailing?: React.ReactNode;
  className?: string;
}

export function TableCardHeader({
  title,
  badge,
  contentTrailing,
  className,
}: TableCardHeaderProps) {
  return (
    <div
      className={clsx(
        'p-4 md:p-6 border-b border-hairline flex items-center justify-between relative',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <h2 className="text-base md:text-lg font-semibold text-ink tracking-tight font-display">
          {title}
        </h2>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {badge}
          </span>
        )}
      </div>
      {contentTrailing}
    </div>
  );
}

export const TableCard = {
  Root: TableCardRoot,
  Header: TableCardHeader,
};

// ============================================================
// TABLE
// ============================================================
export interface TableProps {
  'aria-label'?: string;
  selectionMode?: 'none' | 'single' | 'multiple';
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  children: React.ReactNode;
  className?: string;
}

export function TableRoot({
  'aria-label': ariaLabel,
  selectionMode = 'none',
  sortDescriptor,
  onSortChange,
  children,
  className,
}: TableProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [rowIds, setRowIds] = useState<string[]>([]);

  const toggleSelectRow = (id: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size >= rowIds.length && rowIds.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(rowIds));
    }
  };

  const isAllSelected = rowIds.length > 0 && selectedKeys.size === rowIds.length;
  const isPartiallySelected = selectedKeys.size > 0 && selectedKeys.size < rowIds.length;

  return (
    <TableContext.Provider
      value={{
        sortDescriptor,
        onSortChange,
        selectedKeys,
        toggleSelectAll,
        toggleSelectRow,
        isAllSelected,
        isPartiallySelected,
        totalRows: rowIds.length,
      }}
    >
      <div className={clsx('w-full overflow-x-auto', className)}>
        <table aria-label={ariaLabel} className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

// ── Table Header ──────────────────────────────────────────────
export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  const ctx = useContext(TableContext);

  return (
    <thead className={clsx('bg-surface-soft border-b border-hairline', className)}>
      <tr>
        {ctx?.onSortChange && (
          <th className="w-10 px-4 py-3">
            <input
              type="checkbox"
              checked={ctx.isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = ctx.isPartiallySelected;
              }}
              onChange={ctx.toggleSelectAll}
              aria-label="Select all rows"
              className="rounded border-hairline text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
            />
          </th>
        )}
        {children}
      </tr>
    </thead>
  );
}

// ── Table Head ────────────────────────────────────────────────
export interface TableHeadProps {
  id?: string;
  label?: string;
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  tooltip?: string;
  className?: string;
}

export function TableHead({
  id,
  label,
  allowsSorting,
  tooltip,
  className,
}: TableHeadProps) {
  const ctx = useContext(TableContext);
  const isSorted = ctx?.sortDescriptor?.column === id;
  const direction = ctx?.sortDescriptor?.direction;

  const handleClick = () => {
    if (!allowsSorting || !id || !ctx?.onSortChange) return;
    const nextDirection = isSorted && direction === 'ascending' ? 'descending' : 'ascending';
    ctx.onSortChange({
      column: id,
      direction: nextDirection,
    });
  };

  return (
    <th
      scope="col"
      onClick={handleClick}
      className={clsx(
        'px-4 py-3 text-xs font-semibold text-muted tracking-tight select-none',
        allowsSorting && 'cursor-pointer hover:text-ink',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help">
            <HelpCircle size={13} className="text-gray-400 hover:text-muted" />
          </span>
        )}
        {allowsSorting && (
          <span className="flex flex-col text-muted">
            {isSorted ? (
              direction === 'ascending' ? (
                <ArrowUp size={12} className="text-primary font-bold" />
              ) : (
                <ArrowDown size={12} className="text-primary font-bold" />
              )
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">↕</span>
            )}
          </span>
        )}
      </div>
    </th>
  );
}

// ── Table Body ────────────────────────────────────────────────
export interface TableBodyProps<T> {
  items: T[];
  children: (item: T) => React.ReactNode;
  className?: string;
}

export function TableBody<T extends { username?: string; id?: string }>({
  items,
  children,
  className,
}: TableBodyProps<T>) {
  return (
    <tbody className={clsx('divide-y divide-hairline bg-white', className)}>
      {items.map((item) => children(item))}
    </tbody>
  );
}

// ── Table Row ─────────────────────────────────────────────────
export interface TableRowProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function TableRow({ id, children, className }: TableRowProps) {
  const ctx = useContext(TableContext);
  const isSelected = id ? ctx?.selectedKeys.has(id) : false;

  return (
    <tr
      className={clsx(
        'hover:bg-[#f9fafb] transition-colors',
        isSelected && 'bg-purple-50/40',
        className
      )}
    >
      {ctx?.onSortChange && (
        <td className="w-10 px-4 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => id && ctx.toggleSelectRow(id)}
            aria-label={`Select row ${id || ''}`}
            className="rounded border-hairline text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
          />
        </td>
      )}
      {children}
    </tr>
  );
}

// ── Table Cell ────────────────────────────────────────────────
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td
      className={clsx('px-4 py-3.5 text-sm text-body font-sans', className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ── Compound Table export ─────────────────────────────────────
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
});

export default Table;
