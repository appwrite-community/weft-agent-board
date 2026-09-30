import { createFileRoute, Link } from '@tanstack/react-router';
import { BoardSkeleton } from '@/components/board/board-skeleton';
import { BoardView } from '@/components/board/board-view';
import { EmptyPanel } from '@/components/shell/empty-panel';
import { buttonVariants } from '@/components/ui/button';
import {
  boardQuery,
  boardsQuery,
  cardsQuery,
  membersQuery,
  runsQuery,
  stepsQuery,
  teamQuery,
} from '@/lib/queries';

type BoardSearch = { card?: string };

export const Route = createFileRoute('/_app/boards/$boardId')({
  validateSearch: (search: Record<string, unknown>): BoardSearch => ({
    card: typeof search.card === 'string' && search.card ? search.card : undefined,
  }),
  loader: async ({ context: { queryClient }, params: { boardId } }) => {
    const board = await queryClient.ensureQueryData(boardQuery(boardId));
    if (!board) return { board: null };
    await Promise.all([
      queryClient.ensureQueryData(cardsQuery(boardId)),
      queryClient.ensureQueryData(runsQuery(boardId)),
      queryClient.ensureQueryData(stepsQuery(boardId)),
      queryClient.ensureQueryData(membersQuery(board.teamId)),
      queryClient.ensureQueryData(teamQuery(board.teamId)),
      queryClient.ensureQueryData(boardsQuery),
    ]);
    return { board };
  },
  pendingComponent: BoardSkeleton,
  pendingMs: 150,
  component: BoardPage,
});

function BoardPage() {
  const { board } = Route.useLoaderData();
  if (!board) return <BoardUnavailable />;
  return <BoardView key={board.$id} board={board} />;
}

function BoardUnavailable() {
  return (
    <EmptyPanel
      title="This board isn't available"
      description="It may have been deleted, or you aren't a member of its workspace."
      action={
        <Link to="/" className={buttonVariants({ variant: 'primary' })}>
          Go to your boards
        </Link>
      }
    />
  );
}
