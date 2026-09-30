import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { SearchIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { useBoard } from '@/components/board/board-context';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { teamQuery } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { AgentPill } from './agent-pill';
import { BoardSwitcher } from './board-switcher';
import { PresenceStack } from './presence-stack';
import { UserMenu } from './user-menu';

type TopBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

export function TopBar({ search, onSearchChange, searchRef }: TopBarProps) {
  const { board, dockOpen, setDockOpen } = useBoard();
  const { data: team } = useQuery(teamQuery(board.teamId));
  const [searchExpanded, setSearchExpanded] = useState(false);

  return (
    <header className="relative z-20 flex h-13 shrink-0 items-center gap-2 border-b border-border bg-canvas pr-3 pl-4">
      <Link
        to="/"
        aria-label="Weft home"
        className="-ml-1 flex size-8 items-center justify-center rounded-lg"
      >
        <LogoMark size={22} />
      </Link>
      <nav aria-label="Board" className="flex min-w-0 items-center gap-1 text-13">
        <span className="hidden truncate pl-1 text-muted sm:inline">{team?.name}</span>
        <span aria-hidden className="hidden text-[#46464d] sm:inline">
          /
        </span>
        <BoardSwitcher />
      </nav>

      <div
        className={cn(
          'ml-3 hidden items-center md:flex',
          searchExpanded &&
            'absolute inset-x-3 top-1/2 z-10 ml-0 flex -translate-y-1/2 bg-canvas md:static md:translate-y-0',
        )}
      >
        <label className="group relative flex h-8 w-full items-center md:w-60">
          <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-subtle" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onSearchChange('');
                event.currentTarget.blur();
                setSearchExpanded(false);
              }
            }}
            placeholder="Search cards"
            aria-label="Search cards"
            className="h-8 w-full rounded-lg border border-border bg-surface pr-8 pl-8 text-13 text-fg transition-colors duration-150 outline-none hover:border-border-strong focus-visible:border-[#4a4a52] focus-visible:outline-none"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 flex size-5 items-center justify-center rounded text-subtle hover:text-fg"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <Kbd className="pointer-events-none absolute right-1.5">/</Kbd>
          )}
        </label>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search cards"
          className="md:hidden"
          onClick={() => {
            setSearchExpanded(true);
            requestAnimationFrame(() => searchRef.current?.focus());
          }}
        >
          <SearchIcon />
        </Button>
        <PresenceStack />
        <AgentPill />
        <Tooltip content={dockOpen ? 'Hide the agent (A)' : 'Show the agent (A)'}>
          <Button
            variant="ghost"
            aria-label="Agent"
            aria-pressed={dockOpen}
            onClick={() => setDockOpen(!dockOpen)}
            className="gap-1.5 px-2.5 text-fg aria-pressed:bg-card aria-pressed:shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
          >
            <SparklesIcon className="text-agent" />
            <span className="hidden sm:inline">Agent</span>
          </Button>
        </Tooltip>
        <div aria-hidden className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
