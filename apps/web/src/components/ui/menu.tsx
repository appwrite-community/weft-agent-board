import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { ContextMenu as ContextPrimitive, DropdownMenu as DropdownPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const contentStyles =
  'z-50 min-w-44 overflow-hidden rounded-xl border border-border-strong bg-popover p-1 text-fg shadow-popover outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0';
const itemStyles =
  'relative flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-13 text-fg outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-card-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted';
const separatorStyles = '-mx-1 my-1 h-px bg-border';
const labelStyles = 'px-2 pt-1.5 pb-1 text-11 font-medium tracking-wide text-subtle uppercase';

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(contentStyles, className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item>) {
  return <DropdownPrimitive.Item className={cn(itemStyles, className)} {...props} />;
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem className={cn(itemStyles, 'pr-8', className)} {...props}>
      {children}
      <DropdownPrimitive.ItemIndicator className="absolute right-2 inline-flex">
        <CheckIcon className="text-fg!" />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.RadioItem>
  );
}

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <DropdownPrimitive.Separator className={cn(separatorStyles, className)} />
);

export const DropdownMenuLabel = ({ className, ...props }: ComponentProps<'div'>) => (
  <DropdownPrimitive.Label className={cn(labelStyles, className)} {...props} />
);

export const ContextMenu = ContextPrimitive.Root;
export const ContextMenuTrigger = ContextPrimitive.Trigger;
export const ContextMenuSub = ContextPrimitive.Sub;

export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof ContextPrimitive.Content>) {
  return (
    <ContextPrimitive.Portal>
      <ContextPrimitive.Content
        collisionPadding={8}
        className={cn(contentStyles, className)}
        {...props}
      />
    </ContextPrimitive.Portal>
  );
}

export function ContextMenuItem({
  className,
  ...props
}: ComponentProps<typeof ContextPrimitive.Item>) {
  return <ContextPrimitive.Item className={cn(itemStyles, className)} {...props} />;
}

export function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof ContextPrimitive.SubTrigger>) {
  return (
    <ContextPrimitive.SubTrigger
      className={cn(itemStyles, 'data-[state=open]:bg-card-hover', className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextPrimitive.SubTrigger>
  );
}

export function ContextMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof ContextPrimitive.SubContent>) {
  return (
    <ContextPrimitive.Portal>
      <ContextPrimitive.SubContent
        collisionPadding={8}
        className={cn(contentStyles, className)}
        {...props}
      />
    </ContextPrimitive.Portal>
  );
}

export const ContextMenuLabel = ({ className, ...props }: ComponentProps<'div'>) => (
  <ContextPrimitive.Label className={cn(labelStyles, className)} {...props} />
);

export const ContextMenuSeparator = ({ className }: { className?: string }) => (
  <ContextPrimitive.Separator className={cn(separatorStyles, className)} />
);
