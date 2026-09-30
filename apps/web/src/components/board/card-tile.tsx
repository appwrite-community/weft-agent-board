import { CalendarIcon, ListChecksIcon, SparkleIcon } from 'lucide-react';
import type { CSSProperties, ComponentProps } from 'react';
import { AgentGlyph } from '@/components/brand/logo';
import { Avatar } from '@/components/brand/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { firstName, isOverdue, relativeTime, shortDate } from '@/lib/format';
import { activityVerb } from '@/lib/presence';
import type { Card, Member, Presence } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useBoard } from './board-context';
import { LabelChip, PriorityIcon } from './card-parts';

/** How long a card shows that the agent changed it. */
const RECENT_MS = 10 * 60_000;

export type CardViewer = { presence: Presence; member: Member };

type CardTileProps = ComponentProps<'div'> & {
  card: Card;
  viewers?: CardViewer[];
  /** The card the agent just created: a teal ring that fades. */
  fresh?: boolean;
  lifted?: boolean;
};

export function CardTile({
  card,
  viewers = [],
  fresh,
  lifted,
  className,
  style,
  ...props
}: CardTileProps) {
  const { memberById, cards, now, agent } = useBoard();
  const assignee = card.assigneeId ? memberById.get(card.assigneeId) : undefined;
  const subtasks = cards.filter((item) => item.parentId === card.$id);
  const doneSubtasks = subtasks.filter((item) => item.status === 'done').length;
  const agentChanged =
    !!agent && card.editedBy === agent.userId && now - Date.parse(card.$updatedAt) < RECENT_MS;
  const agentViewer = viewers.find(({ member }) => member.isAgent);
  const ringColor = agentViewer ? undefined : viewers[0]?.member.color;
  const hasTopRow = card.label || card.priority !== 'none';

  return (
    <div
      className={cn(
        'group/card relative flex min-h-19 flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out',
        'hover:border-border-strong hover:bg-card-hover',
        (agentViewer || ringColor) && 'border-transparent hover:border-transparent',
        agentViewer &&
          'shadow-[0_0_0_1.5px_var(--color-agent),0_0_28px_-6px_var(--color-agent-glow)]',
        fresh && !agentViewer && 'animate-agent-ring',
        lifted && 'rotate-1 scale-[1.02] border-border-strong bg-card-hover shadow-lift',
        className,
      )}
      style={
        {
          ...style,
          ...(ringColor && { boxShadow: `0 0 0 1.5px ${ringColor}` }),
        } as CSSProperties
      }
      {...props}
    >
      {viewers.length > 0 && <ViewerTags viewers={viewers} />}

      {hasTopRow && (
        <div className="flex h-5 items-center justify-between gap-2">
          {card.label ? <LabelChip label={card.label} /> : <span />}
          <PriorityIcon priority={card.priority} />
        </div>
      )}

      <p className="line-clamp-2 text-14 leading-[1.35] font-medium text-fg">{card.title}</p>

      <div className="flex h-5 items-center gap-2.5 text-12 text-subtle">
        <Tooltip content={assignee ? assignee.name : 'Unassigned'}>
          <span tabIndex={-1} className="inline-flex">
            <Avatar member={assignee} size={20} />
          </span>
        </Tooltip>
        {card.dueAt && (
          <span
            className={cn(
              'tabular inline-flex items-center gap-1',
              isOverdue(card.dueAt, now) && 'text-danger',
            )}
          >
            <CalendarIcon className="size-3.5" />
            {shortDate(card.dueAt)}
          </span>
        )}
        {subtasks.length > 0 && (
          <span className="tabular inline-flex items-center gap-1">
            <ListChecksIcon className="size-3.5" />
            {doneSubtasks}/{subtasks.length}
          </span>
        )}
        {agentChanged && (
          <Tooltip content={`Updated by the agent ${relativeTime(card.$updatedAt, now)}`}>
            <span tabIndex={-1} className="ml-auto inline-flex text-agent">
              <SparkleIcon className="size-3.5 fill-current" />
            </span>
          </Tooltip>
        )}
      </div>

      {card.agentNote && (
        <Tooltip content={card.agentNote} side="bottom" align="start">
          <p className="-mt-0.5 flex min-w-0 items-center gap-1.5 border-l-2 border-agent/60 pl-2 text-12 text-muted">
            <span className="truncate">{card.agentNote}</span>
          </p>
        </Tooltip>
      )}
    </div>
  );
}

/** Name tags above the top-right corner for everyone who has this card open. */
function ViewerTags({ viewers }: { viewers: CardViewer[] }) {
  return (
    <div className="pointer-events-none absolute -top-2.5 right-2 z-10 flex flex-row-reverse gap-1">
      {viewers.map(({ presence, member }) =>
        member.isAgent ? (
          <span
            key={member.userId}
            className="inline-flex h-4.5 items-center gap-1 rounded-[5px] bg-agent px-1.5 text-11 leading-none font-semibold text-agent-fg shadow-[0_0_12px_var(--color-agent-glow)]"
          >
            <AgentGlyph className="size-2.5" />
            Agent · {activityVerb(presence.metadata?.activity)}
          </span>
        ) : (
          <span
            key={member.userId}
            className="inline-flex h-4.5 items-center rounded-[5px] px-1.5 text-11 leading-none font-semibold text-canvas"
            style={{ background: member.color }}
          >
            {firstName(member.name)}
            {presence.status === 'editing' && ' · editing'}
          </span>
        ),
      )}
    </div>
  );
}
