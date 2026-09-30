import { CalendarIcon, SparkleIcon, TagIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { AgentGlyph } from '@/components/brand/logo';
import { Avatar } from '@/components/brand/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  COLUMN_NAMES,
  COLUMNS,
  LABELS,
  PRIORITIES,
  columnCards,
  labelInfo,
  priorityName,
} from '@/lib/board';
import { exactTime, firstName, isOverdue, longDate, relativeTime, shortDate } from '@/lib/format';
import { runTitle } from '@/lib/runs';
import type { Card, CardStatus, Label, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useBoard } from './board-context';
import { PriorityIcon, StatusIcon } from './card-parts';

const NONE = 'none';

export function CardProperties({ card }: { card: Card }) {
  const { actions, cards, members, memberById, now } = useBoard();
  const people = members.filter((member) => !member.isAgent);
  const assignee = card.assigneeId ? memberById.get(card.assigneeId) : undefined;

  const setStatus = (status: CardStatus) => {
    if (status === card.status) return;
    const top = columnCards(cards, status)[0];
    actions.updateCard(card.$id, { status, position: top ? top.position - 1000 : 1000 });
  };

  return (
    <div className="space-y-5">
      <dl className="space-y-1">
        <Property label="Status">
          <Picker
            value={card.status}
            onChange={(value) => setStatus(value as CardStatus)}
            options={COLUMNS.map(({ status, name }) => ({
              value: status,
              label: name,
              icon: <StatusIcon status={status} className="text-muted" />,
            }))}
          >
            <StatusIcon status={card.status} className="text-muted" />
            {COLUMN_NAMES[card.status]}
          </Picker>
        </Property>

        <Property label="Priority">
          <Picker
            value={card.priority}
            onChange={(value) => actions.updateCard(card.$id, { priority: value as Priority })}
            options={PRIORITIES.map(({ value, name }) => ({
              value,
              label: name,
              icon:
                value === 'none' ? <span className="size-4" /> : <PriorityIcon priority={value} />,
            }))}
          >
            {card.priority === 'none' ? (
              <span className="text-subtle">No priority</span>
            ) : (
              <>
                <PriorityIcon priority={card.priority} />
                {priorityName(card.priority)}
              </>
            )}
          </Picker>
        </Property>

        <Property label="Label">
          <Picker
            value={card.label ?? NONE}
            onChange={(value) =>
              actions.updateCard(card.$id, { label: value === NONE ? null : (value as Label) })
            }
            options={[
              ...LABELS.map(({ value, name, color }) => ({
                value,
                label: name,
                icon: <span className="mx-1 size-2 rounded-full" style={{ background: color }} />,
              })),
              { value: NONE, label: 'No label', icon: <TagIcon /> },
            ]}
          >
            {card.label ? (
              <>
                <span
                  className="mx-1 size-2 rounded-full"
                  style={{ background: labelInfo(card.label).color }}
                />
                {labelInfo(card.label).name}
              </>
            ) : (
              <span className="text-subtle">No label</span>
            )}
          </Picker>
        </Property>

        <Property label="Assignee">
          <Picker
            value={card.assigneeId ?? NONE}
            onChange={(value) =>
              actions.updateCard(card.$id, { assigneeId: value === NONE ? null : value })
            }
            options={[
              ...people.map((person) => ({
                value: person.userId,
                label: person.name,
                icon: <Avatar member={person} size={18} />,
              })),
              { value: NONE, label: 'Unassigned', icon: <Avatar member={undefined} size={18} /> },
            ]}
          >
            <Avatar member={assignee} size={18} />
            {assignee ? assignee.name : <span className="text-subtle">Unassigned</span>}
          </Picker>
        </Property>

        <Property label="Due date">
          <DuePicker card={card} now={now} />
        </Property>
      </dl>

      <Attribution card={card} />
    </div>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-18 shrink-0 text-12 text-subtle">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

const triggerStyles =
  'flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-13 text-fg transition-colors duration-150 hover:bg-card-hover data-[state=open]:bg-card-hover [&>svg]:size-4 [&>svg]:shrink-0';

type PickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
  children: ReactNode;
};

function Picker({ value, onChange, options, children }: PickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerStyles}>
        <span className="flex min-w-0 items-center gap-2 truncate">{children}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.icon}
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DuePicker({ card, now }: { card: Card; now: number }) {
  const { actions } = useBoard();
  const [open, setOpen] = useState(false);
  const selected = card.dueAt ? new Date(card.dueAt) : undefined;

  const save = (date: Date | null) => {
    setOpen(false);
    if (!date) return actions.updateCard(card.$id, { dueAt: null });
    // Noon UTC keeps the same calendar day in every time zone the team works in.
    const dueAt = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
    actions.updateCard(card.$id, { dueAt: dueAt.toISOString() });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerStyles}>
        <CalendarIcon className="text-muted" />
        {card.dueAt ? (
          <span className={cn('tabular', isOverdue(card.dueAt, now) && 'text-danger')}>
            {shortDate(card.dueAt)}
          </span>
        ) : (
          <span className="text-subtle">No due date</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => save(date ?? null)}
        />
        {card.dueAt && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-12 text-subtle">{longDate(card.dueAt)}</span>
            <Button variant="ghost" size="sm" onClick={() => save(null)}>
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Who created the card and who changed it last: a person, or the agent on someone's request. */
function Attribution({ card }: { card: Card }) {
  const { memberById, runs, cards, now, agent, showRun } = useBoard();
  const creator = memberById.get(card.createdBy);
  const editor = card.editedBy ? memberById.get(card.editedBy) : undefined;
  const run = card.runId ? runs.find((item) => item.$id === card.runId) : undefined;
  const requester = run ? memberById.get(run.requestedBy) : undefined;
  const edited = card.editedBy && card.$updatedAt !== card.$createdAt;
  const byAgent = edited && agent && card.editedBy === agent.userId;

  return (
    <div className="space-y-3 border-t border-border pt-4 text-12 text-subtle">
      <p className="flex items-center gap-2">
        <Avatar member={creator} size={16} />
        <span className="min-w-0">
          Created by <span className="text-muted">{creator?.name ?? 'a former member'}</span>
          <span title={exactTime(card.$createdAt)}> · {shortDate(card.$createdAt)}</span>
        </span>
      </p>

      {byAgent ? (
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-agent text-agent-fg">
            <AgentGlyph className="size-2.5" />
          </span>
          <p className="min-w-0">
            Last change by <span className="text-agent">the agent</span>
            {run && requester && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => showRun(run.$id)}
                  className="text-left text-muted underline decoration-border-strong underline-offset-2 hover:text-fg hover:decoration-subtle"
                >
                  {firstName(requester.name)}'s request “{runTitle(run, cards)}”
                </button>
              </>
            )}
            <span title={exactTime(card.$updatedAt)}> · {relativeTime(card.$updatedAt, now)}</span>
          </p>
        </div>
      ) : (
        edited &&
        editor && (
          <p className="flex items-center gap-2">
            <Avatar member={editor} size={16} />
            <span className="min-w-0">
              Last change by <span className="text-muted">{editor.name}</span>
              <span title={exactTime(card.$updatedAt)}>
                {' '}
                · {relativeTime(card.$updatedAt, now)}
              </span>
            </span>
          </p>
        )
      )}

      {card.agentNote && (
        <div className="rounded-lg border border-agent/20 bg-agent/[0.06] px-3 py-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-11 font-medium text-agent">
            <SparkleIcon className="size-3 fill-current" />
            Agent note
          </p>
          <p className="text-12 leading-normal text-[#d4d4d8]">{card.agentNote}</p>
        </div>
      )}
    </div>
  );
}
