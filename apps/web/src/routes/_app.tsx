import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { usePresenceFeed } from '@/hooks/use-presence';
import { accountQuery } from '@/lib/queries';

/** Every route inside needs a signed-in user. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(accountQuery);
    if (!user) throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    return { user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  usePresenceFeed(user.$id);
  return <Outlet />;
}
