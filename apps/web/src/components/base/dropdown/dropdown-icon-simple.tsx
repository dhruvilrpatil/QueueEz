import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, RefreshCw, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export interface DropdownIconSimpleProps {
  className?: string;
}

export function DropdownIconSimple({ className }: DropdownIconSimpleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (label: string) => {
    toast.success(`${label} action triggered`);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={clsx('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg border border-hairline bg-white hover:bg-surface-soft text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Table options"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white border border-hairline shadow-md py-1 z-30 divide-y divide-hairline">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleAction('Export CSV')}
              className="w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-soft flex items-center gap-2 cursor-pointer"
            >
              <Download size={14} className="text-muted" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction('Filter view')}
              className="w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-soft flex items-center gap-2 cursor-pointer"
            >
              <Filter size={14} className="text-muted" />
              <span>Filter view</span>
            </button>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleAction('Refresh data')}
              className="w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-soft flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className="text-muted" />
              <span>Refresh directory</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DropdownIconSimple;
