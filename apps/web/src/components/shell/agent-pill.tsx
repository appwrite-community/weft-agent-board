import { useQuery } from '@tanstack/react-query';
import { useBoard } from '@/components/board/board-context';
import { boardsQuery } from '@/lib/queries';

/** Shows what the agent does right now, from its presence. Only while it works. */
export function AgentPill() {
  const { agentPresence, board, setDockOpen } = useBoard();
  const { data: boards = [] } = useQuery(boardsQuery);
  if (!agentPresence) return null;

  const metadata = agentPresence.metadata ?? {};
  const elsewhere = metadata.boardId && metadata.boardId !== board.$id;
  const text = elsewhere
    ? `Working on ${boards.find((item) => item.$id === metadata.boardId)?.name ?? 'another board'}`
    : (metadata.activity ?? 'Working');

  return (
    <button
      type="button"
      onClick={() => setDockOpen(true)}
      aria-live="polite"
      className="hidden h-7 max-w-70 items-center gap-2 rounded-full border border-agent/25 bg-agent/10 pr-3 pl-2.5 text-12 font-medium text-agent transition-colors duration-150 hover:bg-agent/15 lg:flex"
    >
      <span className="size-1.5 shrink-0 animate-pulse-dot rounded-full bg-agent shadow-[0_0_8px_var(--color-agent-glow)]" />
      <span className="truncate">{text}</span>
    </button>
  );
}
