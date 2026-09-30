import { useMutation } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  FileTextIcon,
  InboxIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  RotateCcwIcon,
  SplitIcon,
  SquareIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/brand/avatar';
import { useBoard } from '@/components/board/board-context';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { useAgentRequest } from '@/hooks/use-agent-request';
import { AgentRequestError, stopRun } from '@/lib/agent';
import { duration, exactTime, firstName, relativeTime } from '@/lib/format';
import { runTitle } from '@/lib/runs';
import type { Run, RunKind } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RunStatusChip } from './run-status';
import { StepTimeline } from './step-timeline';

const KIND_ICONS: Record<RunKind, LucideIcon> = {
  triage: InboxIcon,
  split: SplitIcon,
  draft: FileTextIcon,
  summary: NotebookPenIcon,
  ask: MessageSquareTextIcon,
};

function useStop(run: Run) {
  return useMutation({
    mutationFn: () => stopRun(run.$id),
    onError: (err) =>
      toast.error(
        err instanceof AgentRequestError ? err.message : "Couldn't stop the request. Try again.",
      ),
  });
}

type RunItemProps = {
  run: Run;
  expanded: boolean;
  onToggle?: () => void;
};

export function RunItem({ run, expanded, onToggle }: RunItemProps) {
  const { memberById, cards, now, focusedRunId } = useBoard();
  const ref = useRef<HTMLElement>(null);
  const requester = memberById.get(run.requestedBy);
  const Icon = KIND_ICONS[run.kind];
  const title = runTitle(run, cards);

  useEffect(() => {
    if (focusedRunId === run.$id)
      ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRunId, run.$id]);

  if (!expanded) {
    const finished = run.finishedAt;
    return (
      <article ref={ref}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-card"
        >
          <Icon className="mt-0.5 size-4 shrink-0 text-subtle" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-13 text-fg">{title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-12 text-subtle">
              <Avatar member={requester} size={14} />
              <span className="truncate">{requester ? firstName(requester.name) : 'Someone'}</span>
              <span aria-hidden>·</span>
              <span title={exactTime(run.$createdAt)} className="shrink-0">
                {relativeTime(run.$createdAt, now)}
              </span>
              {finished && run.startedAt && (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular shrink-0 font-mono text-11">
                    {duration(run.startedAt, finished)}
                  </span>
                </>
              )}
            </span>
          </span>
          <RunStatusChip status={run.status} className="mt-px" />
        </button>
      </article>
    );
  }

  return <ExpandedRun run={run} onToggle={onToggle} articleRef={ref} />;
}

function ExpandedRun({
  run,
  onToggle,
  articleRef,
}: {
  run: Run;
  onToggle?: () => void;
  articleRef: React.RefObject<HTMLElement | null>;
}) {
  const { memberById, cards, steps, agentPresence, now, focusedRunId } = useBoard();
  const stop = useStop(run);
  const { request: retry, busy: retrying } = useAgentRequest();
  const requester = memberById.get(run.requestedBy);
  const stopper = run.stoppedBy ? memberById.get(run.stoppedBy) : undefined;
  const runSteps = steps.filter((step) => step.runId === run.$id);
  const current =
    run.status === 'running' && agentPresence?.metadata?.runId === run.$id
      ? agentPresence
      : undefined;
  const open = run.status === 'queued' || run.status === 'running';
  const stopping = open && !!run.stoppedBy;
  const timeline = runSteps.length > 0 || current;

  return (
    <article
      ref={articleRef}
      className={cn(
        'overflow-hidden rounded-xl border bg-card/60',
        run.status === 'running' ? 'border-agent/25' : 'border-border',
        focusedRunId === run.$id && 'ring-1 ring-border-strong',
      )}
    >
      <header className="flex items-start gap-2.5 px-3 pt-3">
        <Avatar member={requester} size={22} className="mt-px" />
        <div className="min-w-0 flex-1">
          <h3 className="text-13 leading-snug">
            <span className="font-medium text-fg">
              {requester ? firstName(requester.name) : 'Someone'}
            </span>
            <span className="text-subtle"> · </span>
            <span className="text-fg">{runTitle(run, cards)}</span>
          </h3>
          <p className="mt-0.5 text-12 text-subtle" title={exactTime(run.$createdAt)}>
            {run.status === 'queued' ? 'Asked ' : run.status === 'running' ? 'Started ' : ''}
            {relativeTime(run.startedAt ?? run.$createdAt, now)}
            {run.finishedAt && run.startedAt && (
              <span className="tabular font-mono text-11">
                {' '}
                · {duration(run.startedAt, run.finishedAt)}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RunStatusChip status={run.status} />
          {onToggle && (
            <Tooltip content="Collapse">
              <Button variant="ghost" size="icon-sm" aria-label="Collapse" onClick={onToggle}>
                <ChevronDownIcon className="rotate-180" />
              </Button>
            </Tooltip>
          )}
        </div>
      </header>

      <div className="space-y-3 px-3 pt-3 pb-3">
        {timeline && (
          <div className="border-t border-border pt-3">
            <StepTimeline run={run} steps={runSteps} current={current} />
          </div>
        )}

        {run.status === 'running' && !timeline && !run.reply && (
          <p className="flex items-center gap-2 border-t border-border pt-3 text-13 text-muted">
            <Spinner className="text-agent" />
            Starting…
          </p>
        )}

        {run.reply && run.status !== 'failed' && (
          <div
            className={cn(
              'rounded-lg border border-border bg-surface px-3 py-2.5',
              run.status === 'stopped' && 'text-muted',
            )}
          >
            <Markdown streaming={run.status === 'running'} className="text-13 leading-[1.55]">
              {run.reply}
            </Markdown>
          </div>
        )}

        {run.status === 'failed' && (
          <div className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5">
            <p className="text-13 text-[#fca5a5]">
              {run.error ?? 'The agent could not finish this request.'}
            </p>
            <Button
              size="sm"
              className="mt-2.5"
              disabled={retrying}
              onClick={() =>
                retry({
                  boardId: run.boardId,
                  kind: run.kind,
                  cardId: run.cardId ?? undefined,
                  prompt: run.prompt ?? undefined,
                })
              }
            >
              <RotateCcwIcon />
              Try again
            </Button>
          </div>
        )}

        {run.status === 'stopped' && stopper && !run.reply && (
          <p className="text-12 text-subtle">Stopped by {stopper.name}</p>
        )}

        {open && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-12 text-subtle">
              {stopping
                ? `${stopper ? firstName(stopper.name) : 'Someone'} asked the agent to stop`
                : run.status === 'queued'
                  ? 'Waiting for the current request to finish'
                  : 'Everyone on the board sees each change as it happens'}
            </p>
            <Button
              size="sm"
              variant="secondary"
              disabled={stopping || stop.isPending}
              onClick={() => stop.mutate()}
            >
              {run.status === 'queued' ? <XIcon /> : <SquareIcon className="fill-current" />}
              {run.status === 'queued' ? 'Cancel' : 'Stop'}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
