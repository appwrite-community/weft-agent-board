import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[color,background-color,border-color,opacity] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-fg text-canvas hover:bg-white',
        secondary:
          'border border-border-strong bg-card text-fg hover:border-[#3f3f47] hover:bg-card-hover',
        ghost: 'text-muted hover:bg-card-hover hover:text-fg',
        danger: 'bg-danger text-[#1c0606] hover:bg-[#fb8b8b]',
      },
      size: {
        sm: 'h-7 px-2.5 text-12 [&_svg]:size-3.5',
        md: 'h-8 px-3 text-13 [&_svg]:size-4',
        lg: 'h-10 px-4 text-14 [&_svg]:size-4',
        icon: 'size-8 [&_svg]:size-4',
        'icon-sm': 'size-7 rounded-md [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <Component
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
