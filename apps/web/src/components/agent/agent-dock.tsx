import { useMutation } from '@tanstack/react-query';
import { ArrowUpRightIcon, XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AgentAvatar, Avatar } from '@/components/brand/avatar';
import { useBoard } from '@/components/board/board-context';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { AgentRequestError, stopRun } from '@/lib/agent';
import { firstName } from '@/lib/format';
import { runTitle } from '@/lib/runs';
import type { Run } from '@/lib/types';
import { Composer } from './composer';
import { RunItem } from './run-item';
import { RunStatusChip } from './run-status';

const SUGGESTIONS = [
  'Triage the inbox',
  'Write a standup summary for today',
  'Assign every unassigned bug in Up next',
];

/** The agent panel on the right of the board. */
export function AgentDock() {
  return (
    <aside
      aria-label="Agent"
      className="flex w-95 shrink-0 flex-col border-l border-border bg-surface"
    >
      <DockContents />
    </aside>
  );
}

/** The same panel as a bottom drawer on small screens. */
export function AgentDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement).focus();
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border-t border-border-strong bg-surface shadow-dialog outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom"
        >
          <SheetPrimitive.Title className="sr-only">Agent</SheetPrimitive.Title>
          <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-strong" />
          <DockContents />
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

function DockContents() {
  const { runs, focusedRunId } = useBoard();
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const running = runs.find((run) => run.status === 'running');
  const queued = runs
    .filter((run) => run.status === 'queued')
    .sort((a, b) => a.$createdAt.localeCompare(b.$createdAt));
  const history = runs
    .filter((run) => run.status !== 'running' && run.status !== 'queued')
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
  // The newest finished run stays open until the next one starts.
  const latest = !running && queued.length === 0 ? history[0] : undefined;

  const toggle = (runId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  const isExpanded = (run: Run) =>
    expanded.has(run.$id) !== (run.$id === latest?.$id) || run.$id === focusedRunId;

  return (
    <>
      <DockHeader running={running} waiting={queued.length} />
      <div className="border-b border-border px-4 pb-4">
        <Composer value={draft} onChange={setDraft} inputRef={inputRef} />
      </div>

      {runs.length === 0 ? (
        <EmptyDock
          onPick={(text) => {
            setDraft(text);
            inputRef.current?.focus();
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pt-4 pb-6">
          {(running || queued.length > 0) && (
            <section aria-label="Now" className="space-y-2">
              {running && <RunItem run={running} expanded />}
              {queued.map((run) => (
                <QueuedRow key={run.$id} run={run} />
              ))}
            </section>
          )}
          {history.length > 0 && (
            <section aria-labelledby="dock-history">
              <h2
                id="dock-history"
                className="px-2.5 pb-1.5 text-11 font-medium tracking-wide text-subtle uppercase"
              >
                Recent requests
              </h2>
              <div className="space-y-1">
                {history.map((run) => (
                  <RunItem
                    key={run.$id}
                    run={run}
                    expanded={isExpanded(run)}
                    onToggle={() => toggle(run.$id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function DockHeader({ running, waiting }: { running: Run | undefined; waiting: number }) {
  const { memberById, me, agentPresence, board, setDockOpen } = useBoard();
  const requester = running ? memberById.get(running.requestedBy) : undefined;
  const elsewhere = agentPresence && agentPresence.metadata?.boardId !== board.$id;
  const working = !!running || !!agentPresence;

  let status = 'Ready';
  if (running) {
    status =
      running.requestedBy === me.$id
        ? 'Working on your request'
        : `Working on ${requester ? firstName(requester.name) : 'a teammate'}'s request`;
  } else if (elsewhere) {
    status = 'Working on another board';
  }
  const waitingText =
    waiting > 0 ? `${waiting} ${waiting === 1 ? 'request' : 'requests'} waiting` : '';

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-4">
      <AgentAvatar size={32} ring={working} className="[--avatar-gap:var(--color-surface)]" />
      <div className="min-w-0 flex-1">
        <h2 className="text-14 font-semibold">Agent</h2>
        <p className="flex items-center gap-1.5 truncate text-12 text-muted" aria-live="polite">
          {working && (
            <span className="size-1.5 shrink-0 animate-pulse-dot rounded-full bg-agent" />
          )}
          <span className="truncate">
            {running || elsewhere ? status : waitingText || status}
            {(running || elsewhere) && waitingText && (
              <span className="text-subtle"> · {waitingText}</span>
            )}
          </span>
        </p>
      </div>
      <Tooltip content="Hide the agent (A)">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Hide the agent"
          onClick={() => setDockOpen(false)}
        >
          <XIcon />
        </Button>
      </Tooltip>
    </header>
  );
}

function QueuedRow({ run }: { run: Run }) {
  const { memberById, cards } = useBoard();
  const requester = memberById.get(run.requestedBy);
  const cancel = useMutation({
    mutationFn: () => stopRun(run.$id),
    onError: (err) =>
      toast.error(
        err instanceof AgentRequestError ? err.message : "Couldn't cancel the request. Try again.",
      ),
  });
  const canceling = !!run.stoppedBy || cancel.isPending;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border-strong px-3 py-2">
      <Avatar member={requester} size={20} />
      <p className="min-w-0 flex-1 truncate text-13 text-fg">{runTitle(run, cards)}</p>
      <RunStatusChip status="queued" />
      <Tooltip content={canceling ? 'Canceling' : 'Cancel'}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel"
          disabled={canceling}
          onClick={() => cancel.mutate()}
        >
          <XIcon />
        </Button>
      </Tooltip>
    </div>
  );
}

function EmptyDock({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pt-10 pb-6 text-center">
      <AgentAvatar size={40} />
      <p className="mt-4 text-14 font-medium">The agent works on this board with you</p>
      <p className="mt-1.5 text-13 text-muted">
        Ask for a change and watch it happen. Everyone on the board sees each step.
      </p>
      <ul className="mt-6 w-full space-y-1.5 text-left">
        {SUGGESTIONS.map((text) => (
          <li key={text}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="group flex w-full items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left text-13 text-fg transition-colors duration-150 hover:border-border-strong hover:bg-card"
            >
              <span className="flex-1">{text}</span>
              <ArrowUpRightIcon className="size-3.5 text-subtle transition-colors group-hover:text-fg" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
