import React, { useState, useRef, useEffect, useId } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Check, HelpCircle } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
export interface SelectItemType {
  id: string;
  label: string;
  supportingText?: string;
  isDisabled?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  avatarUrl?: string;
}

export interface SelectItemProps {
  id: string;
  children: React.ReactNode;
  supportingText?: string;
  isDisabled?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  avatarUrl?: string;
  className?: string;
}

/**
 * Item descriptor used with Select compound API or render props
 */
export function SelectItem(_props: SelectItemProps): React.ReactElement | null {
  return null;
}

export interface SelectProps<T extends SelectItemType = SelectItemType> {
  items?: T[];
  label?: string;
  isRequired?: boolean;
  required?: boolean;
  tooltip?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  selectedKey?: string;
  defaultValue?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string) => void;
  onChange?: (value: string) => void;
  isDisabled?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  children?: ((item: T) => React.ReactNode) | React.ReactNode;
  options?: Array<{ value: string; label: string; supportingText?: string }>;
  name?: string;
  id?: string;
}

// ============================================================
// SELECT COMPONENT
// ============================================================
export function Select<T extends SelectItemType = SelectItemType>({
  items,
  label,
  isRequired = false,
  required = false,
  tooltip,
  hint,
  error,
  placeholder = 'Select an option',
  value,
  selectedKey,
  defaultValue,
  defaultSelectedKey,
  onSelectionChange,
  onChange,
  isDisabled = false,
  disabled = false,
  className = '',
  triggerClassName = '',
  children,
  options,
  name,
  id,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const isComponentDisabled = isDisabled || disabled;
  const isFieldRequired = isRequired || required;

  // Active key controlled or uncontrolled
  const activeControlledKey = value !== undefined ? value : selectedKey;
  const [internalKey, setInternalKey] = useState<string>(
    defaultValue || defaultSelectedKey || ''
  );
  const currentKey = activeControlledKey !== undefined ? activeControlledKey : internalKey;

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Normalize parsed items
  const parsedItems: SelectItemType[] = React.useMemo(() => {
    // 1. If options array passed (e.g. from legacy select)
    if (options && options.length > 0) {
      return options.map((opt) => ({
        id: opt.value,
        label: opt.label,
        supportingText: opt.supportingText,
      }));
    }

    // 2. If items and children render-prop provided
    if (items && items.length > 0) {
      if (typeof children === 'function') {
        return items.map((item) => {
          const rendered = children(item) as React.ReactElement<SelectItemProps>;
          if (React.isValidElement(rendered)) {
            const childProps = rendered.props as SelectItemProps;
            return {
              id: childProps.id || item.id,
              label:
                typeof childProps.children === 'string'
                  ? childProps.children
                  : item.label,
              supportingText: childProps.supportingText ?? item.supportingText,
              isDisabled: childProps.isDisabled ?? childProps.disabled ?? item.isDisabled ?? item.disabled,
              icon: childProps.icon ?? item.icon,
              avatarUrl: childProps.avatarUrl ?? item.avatarUrl,
            };
          }
          return item;
        });
      }
      return items;
    }

    // 3. If direct JSX children (<Select.Item ... />)
    if (children && typeof children !== 'function') {
      const result: SelectItemType[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const p = child.props as SelectItemProps;
          result.push({
            id: p.id,
            label: typeof p.children === 'string' ? p.children : String(p.children || p.id),
            supportingText: p.supportingText,
            isDisabled: p.isDisabled ?? p.disabled,
            icon: p.icon,
            avatarUrl: p.avatarUrl,
          });
        }
      });
      return result;
    }

    return [];
  }, [items, children, options]);

  // Find currently selected item
  const selectedItem = parsedItems.find((item) => String(item.id) === String(currentKey));

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComponentDisabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHoveredIndex(0);
      } else {
        setHoveredIndex((prev) => (prev < parsedItems.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHoveredIndex(parsedItems.length - 1);
      } else {
        setHoveredIndex((prev) => (prev > 0 ? prev - 1 : parsedItems.length - 1));
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (hoveredIndex >= 0 && hoveredIndex < parsedItems.length) {
        const item = parsedItems[hoveredIndex];
        if (!item.isDisabled && !item.disabled) {
          selectItem(item.id);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectItem = (itemId: string) => {
    setInternalKey(itemId);
    onSelectionChange?.(itemId);
    onChange?.(itemId);
    setIsOpen(false);
  };

  return (
    <div className={clsx('flex flex-col gap-1.5 relative select-none', className)} ref={containerRef}>
      {/* ── Label & Tooltip ───────────────────────────────────── */}
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={selectId}
              className="text-body-sm font-medium text-ink cursor-pointer"
              onClick={() => !isComponentDisabled && setIsOpen((prev) => !prev)}
            >
              {label}
              {isFieldRequired && <span className="text-error ml-1">*</span>}
            </label>

            {tooltip && (
              <div className="relative group inline-flex items-center">
                <HelpCircle
                  size={14}
                  className="text-muted hover:text-ink cursor-help transition-colors"
                  aria-label="Info tooltip"
                />
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 px-2.5 py-1 text-[11px] font-medium text-white bg-primary rounded-md shadow-elevated whitespace-nowrap pointer-events-none">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hidden Input for Form Submission ───────────────────── */}
      {name && <input type="hidden" name={name} value={currentKey} />}

      {/* ── Trigger Button ────────────────────────────────────── */}
      <button
        id={selectId}
        type="button"
        disabled={isComponentDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={clsx(
          'w-full min-h-[40px] px-3.5 py-2 bg-canvas border rounded-lg text-body-sm text-ink flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer text-left',
          isOpen
            ? 'border-primary ring-2 ring-primary/10'
            : 'border-hairline hover:border-ink/40',
          error && 'border-error ring-2 ring-error/10',
          isComponentDisabled && 'opacity-50 cursor-not-allowed bg-surface-soft',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedItem ? (
            <>
              {selectedItem.avatarUrl && (
                <img
                  src={selectedItem.avatarUrl}
                  alt={selectedItem.label}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              )}
              {selectedItem.icon && (
                <span className="text-muted shrink-0 flex items-center">{selectedItem.icon}</span>
              )}
              <span className="truncate text-ink font-medium">{selectedItem.label}</span>
              {selectedItem.supportingText && (
                <span className="text-xs text-muted truncate">
                  ({selectedItem.supportingText})
                </span>
              )}
            </>
          ) : (
            <span className="text-muted truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={clsx(
            'text-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-ink'
          )}
        />
      </button>

      {/* ── Popover Dropdown Menu ──────────────────────────────── */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-canvas border border-hairline rounded-xl shadow-elevated p-1.5 max-h-64 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-150"
        >
          {parsedItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted text-center">No options available</div>
          ) : (
            parsedItems.map((item, index) => {
              const isSelected = String(item.id) === String(currentKey);
              const isDisabledItem = item.isDisabled || item.disabled;

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabledItem}
                  onClick={() => {
                    if (!isDisabledItem) {
                      selectItem(item.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-medium transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-surface-soft text-ink font-semibold'
                      : 'text-ink hover:bg-surface-soft',
                    hoveredIndex === index && !isSelected && 'bg-surface-soft/80',
                    isDisabledItem &&
                      'opacity-40 cursor-not-allowed hover:bg-transparent pointer-events-none'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.avatarUrl && (
                      <img
                        src={item.avatarUrl}
                        alt={item.label}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    )}
                    {item.icon && (
                      <span className="text-muted shrink-0 flex items-center">{item.icon}</span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm text-ink">{item.label}</span>
                      {item.supportingText && (
                        <span className="text-[12px] text-muted truncate leading-tight">
                          {item.supportingText}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check size={16} className="text-ink shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Hint & Error Texts ─────────────────────────────────── */}
      {error && <p className="text-caption text-error">{error}</p>}
      {hint && !error && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}

// Attach Item compound component
Select.Item = SelectItem;

export default Select;
