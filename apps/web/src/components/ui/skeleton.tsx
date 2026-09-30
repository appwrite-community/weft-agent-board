import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-shimmer rounded-md bg-[#1d1d21]', className)}
      {...props}
    />
  );
}
