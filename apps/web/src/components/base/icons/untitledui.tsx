import React from 'react';
import { Pencil, Trash2, MoreVertical, ChevronDown, Check, ArrowDown, ArrowUp } from 'lucide-react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export function Edit01({ size = 16, className, ...props }: IconProps) {
  return <Pencil size={size} className={className} {...props} />;
}

export function Trash01({ size = 16, className, ...props }: IconProps) {
  return <Trash2 size={size} className={className} {...props} />;
}

export function DotsVertical({ size = 16, className, ...props }: IconProps) {
  return <MoreVertical size={size} className={className} {...props} />;
}

export function ChevronDownIcon({ size = 16, className, ...props }: IconProps) {
  return <ChevronDown size={size} className={className} {...props} />;
}

export function CheckIcon({ size = 16, className, ...props }: IconProps) {
  return <Check size={size} className={className} {...props} />;
}
