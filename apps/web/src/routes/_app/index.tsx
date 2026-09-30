import { createFileRoute, redirect } from '@tanstack/react-router';
import { EmptyPanel } from '@/components/shell/empty-panel';
import { SignOutButton } from '@/components/shell/user-menu';
import { boardsQuery } from '@/lib/queries';

/** Opens the first board the user can read. */
export const Route = createFileRoute('/_app/')({
  loader: async ({ context }) => {
    const boards = await context.queryClient.ensureQueryData(boardsQuery);
    if (boards[0]) {
      throw redirect({ to: '/boards/$boardId', params: { boardId: boards[0].$id }, replace: true });
    }
  },
  component: NoBoards,
});

function NoBoards() {
  return (
    <EmptyPanel
      title="You aren't on a board yet"
      description="Boards belong to workspace teams. Ask a workspace owner to add you to their team."
      action={<SignOutButton />}
    />
  );
}
