import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <TooltipPrimitive.Provider delayDuration={350} skipDelayDuration={200}>
    {children}
  </TooltipPrimitive.Provider>
);

export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'z-50 max-w-72 rounded-md border border-border-strong bg-popover px-2 py-1 text-12 text-fg shadow-popover',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side'];
  align?: ComponentProps<typeof TooltipPrimitive.Content>['align'];
  /** Wraps the child in a focusable span, so disabled buttons still explain themselves. */
  wrap?: boolean;
};

export function Tooltip({ content, children, side, align, wrap }: TooltipProps) {
  if (!content) return <>{children}</>;
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        {wrap ? (
          <span tabIndex={0} className="inline-flex rounded-lg">
            {children}
          </span>
        ) : (
          children
        )}
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}
