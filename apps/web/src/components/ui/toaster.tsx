import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-left"
      offset={20}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl! border! border-border-strong! bg-popover! text-fg! shadow-popover! px-3.5! py-3! gap-2.5! font-sans!',
          title: 'text-13! font-medium!',
          description: 'text-12! text-muted!',
          icon: 'size-4!',
          error: '[&_[data-icon]]:text-danger!',
          success: '[&_[data-icon]]:text-fg!',
        },
      }}
    />
  );
}
