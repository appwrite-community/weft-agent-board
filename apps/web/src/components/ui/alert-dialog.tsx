import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-32px)] max-w-100 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-strong bg-popover p-5 shadow-dialog outline-none',
          'duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogCancel({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'secondary' }), className)}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant: 'danger' }), className)}
      {...props}
    />
  );
}
