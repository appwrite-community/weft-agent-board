import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { RotateCwIcon } from 'lucide-react';
import { EmptyPanel } from '@/components/shell/empty-panel';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <TooltipProvider>
      <Outlet />
      <Toaster />
    </TooltipProvider>
  ),
  errorComponent: () => (
    <EmptyPanel
      title="Something went wrong"
      description="Weft hit an unexpected error. Reload the page to get back to your board."
      action={
        <Button variant="primary" onClick={() => window.location.reload()}>
          <RotateCwIcon />
          Reload
        </Button>
      }
    />
  ),
});
