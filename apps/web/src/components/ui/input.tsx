import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const fieldStyles =
  'w-full rounded-lg border border-border bg-card px-3 text-14 text-fg transition-[border-color,box-shadow] duration-150 ease-out outline-none hover:border-border-strong focus-visible:border-[#4a4a52] focus-visible:shadow-[0_0_0_3px_rgb(237_237_239/0.08)] focus-visible:outline-none disabled:opacity-50 aria-invalid:border-danger/70';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldStyles, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldStyles, 'resize-none py-2.5', className)} {...props} />;
}
