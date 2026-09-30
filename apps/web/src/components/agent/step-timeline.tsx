import {
  ArrowRightIcon,
  CircleSlashIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/brand/avatar';
import { useBoard } from '@/components/board/board-context';
import { PriorityIcon } from '@/components/board/card-parts';
import { LABELS, PRIORITIES } from '@/lib/board';
import type { Presence, Run, Step } from '@/lib/types';
import { cn } from '@/lib/utils';

function stepIcon(step: Step): LucideIcon {
  switch (step.kind) {
    case 'create':
      return PlusIcon;
    case 'write':
      return FileTextIcon;
    case 'skip':
      return CircleSlashIcon;
    case 'update':
      return step.summary.startsWith('Moved') ? ArrowRightIcon : PencilIcon;
  }
}

type StepTimelineProps = {
  run: Run;
  steps: Step[];
  /** The agent's presence while it works on this run: the step in progress. */
  current?: Presence;
};

/** One row per `steps` row. The function writes each one after it changes a card. */
export function StepTimeline({ run, steps, current }: StepTimelineProps) {
  const activity = current?.metadata?.activity;
  const progress = current?.metadata?.progress;
  const started = Date.parse(run.startedAt ?? run.$createdAt);

  return (
    <ol className="space-y-0.5">
      {steps.map((step, index) => {
        const Icon = stepIcon(step);
        const last = index === steps.length - 1 && !activity;
        return (
          <li key={step.$id} className="relative flex gap-2.5 pb-2.5">
            {!last && <Rail />}
            <span
              className={cn(
                'relative z-10 flex size-5.5 shrink-0 items-center justify-center rounded-full border bg-surface',
                step.kind === 'skip'
                  ? 'border-warning/30 text-warning'
                  : 'border-border-strong text-muted',
              )}
            >
              <Icon className="size-3" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <StepSummary step={step} />
            </div>
            <span className="tabular shrink-0 pt-1 font-mono text-11 text-subtle">
              +{Math.max(0, (Date.parse(step.$createdAt) - started) / 1000).toFixed(1)}s
            </span>
          </li>
        );
      })}
      {activity && (
        <li className="relative flex gap-2.5 pb-1" aria-live="polite">
          <span className="relative z-10 flex size-5.5 shrink-0 items-center justify-center rounded-full border border-agent/40 bg-surface">
            <span className="size-3 animate-spin rounded-full border-[1.5px] border-agent/25 border-t-agent" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-13 font-medium text-fg">{activity}</p>
            {progress && progress.total > 0 && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-agent transition-[width] duration-500 ease-out"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}

function Rail() {
  return (
    <span aria-hidden className="absolute top-6 bottom-0 left-[10.5px] w-px bg-border-strong" />
  );
}

/**
 * Step summaries read "Moved “Seat map crashes…” to Up next · Urgent · Bug · Theo Okafor".
 * The quoted title links to the card; the details after " · " become small chips.
 */
function StepSummary({ step }: { step: Step }) {
  const { board, cards, members } = useBoard();
  const [action, ...details] = step.summary.split(' · ');
  const match = action.match(/^(.*?)“(.+?)”(.*)$/);
  const cardExists = !!step.cardId && cards.some((card) => card.$id === step.cardId);

  // A link, not a button, so a long title wraps with the sentence around it.
  const title =
    match &&
    (cardExists ? (
      <Link
        to="/boards/$boardId"
        params={{ boardId: board.$id }}
        search={{ card: step.cardId! }}
        className="font-medium text-fg decoration-border-strong underline-offset-2 hover:underline"
      >
        {match[2]}
      </Link>
    ) : (
      <span className="font-medium text-fg">{match[2]}</span>
    ));

  return (
    <>
      <p className="text-13 leading-snug text-muted">
        {match ? (
          <>
            {match[1]}
            {title}
            {match[3]}
          </>
        ) : (
          action
        )}
      </p>
      {details.length > 0 && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-12 text-muted">
          {details.map((detail) => (
            <Detail key={detail} icon={detailIcon(detail, members)}>
              {detail}
            </Detail>
          ))}
        </p>
      )}
    </>
  );
}

function detailIcon(detail: string, members: ReturnType<typeof useBoard>['members']) {
  const priority = PRIORITIES.find((item) => item.name === detail);
  if (priority && priority.value !== 'none')
    return <PriorityIcon priority={priority.value} className="size-3.5" />;
  const label = LABELS.find((item) => item.name === detail);
  if (label) return <span className="size-1.5 rounded-full" style={{ background: label.color }} />;
  const member = members.find((item) => item.name === detail);
  if (member) return <Avatar member={member} size={14} />;
  return null;
}

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}
