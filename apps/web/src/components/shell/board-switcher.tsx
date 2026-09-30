import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { useBoard } from '@/components/board/board-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { boardCountsQuery, boardsQuery } from '@/lib/queries';
import { cn } from '@/lib/utils';

export function BoardSwitcher() {
  const { board, agentPresence } = useBoard();
  const [open, setOpen] = useState(false);
  const { data: boards = [] } = useQuery(boardsQuery);
  const teamBoards = boards.filter((item) => item.teamId === board.teamId);
  const { data: counts } = useQuery({
    ...boardCountsQuery(teamBoards.map((item) => item.$id)),
    enabled: open,
  });
  const agentBoardId = agentPresence?.metadata?.boardId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-2 text-13 font-medium text-fg transition-colors duration-150 hover:bg-card-hover data-[state=open]:bg-card-hover">
        <span className="truncate">{board.name}</span>
        {agentBoardId && agentBoardId !== board.$id && (
          <span
            aria-label="The agent is working on another board"
            className="size-1.5 rounded-full bg-agent"
          />
        )}
        <ChevronDownIcon className="size-3.5 shrink-0 text-subtle" />
      </PopoverTrigger>
      <PopoverContent className="w-76">
        <p className="px-2 pt-1.5 pb-1 text-11 font-medium tracking-wide text-subtle uppercase">
          Boards
        </p>
        <ul>
          {teamBoards.map((item) => {
            const current = item.$id === board.$id;
            const agentHere = item.$id === agentBoardId;
            return (
              <li key={item.$id}>
                <Link
                  to="/boards/$boardId"
                  params={{ boardId: item.$id }}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-card-hover',
                    current && 'bg-card',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-13 font-medium">{item.name}</span>
                      <span className="tabular text-12 text-subtle">
                        {counts ? counts[item.$id] : ''}
                      </span>
                    </span>
                    {agentHere ? (
                      <span className="mt-0.5 flex items-center gap-1.5 text-12 text-agent">
                        <span className="size-1.5 animate-pulse-dot rounded-full bg-agent" />
                        Agent is working here
                      </span>
                    ) : (
                      <span className="mt-0.5 block truncate text-12 text-subtle">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {current && <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
