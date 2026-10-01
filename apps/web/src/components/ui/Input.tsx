import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-body-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'input',
            icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-error ring-2 ring-error/10',
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="text-caption text-error">{error}</p>}
      {hint && !error && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}

export { Select, SelectItem, type SelectItemType, type SelectProps, type SelectItemProps } from '@/components/base/select/select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-body-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-3.5 py-2.5 bg-canvas text-ink border border-hairline rounded-md text-body-md placeholder-muted transition-colors outline-none resize-none',
          'focus:border-ink focus:ring-2 focus:ring-ink/10',
          error && 'border-error ring-2 ring-error/10',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-caption text-error">{error}</p>}
      {hint && !error && <p className="text-caption text-muted">{hint}</p>}
    </div>
  );
}
