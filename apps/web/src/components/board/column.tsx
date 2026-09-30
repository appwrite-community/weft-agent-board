import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import type { Card, CardStatus } from '@/lib/types';
import { useBoard } from './board-context';
import { StatusIcon } from './card-parts';
import type { CardViewer } from './card-tile';
import { NewCard } from './new-card';
import { SortableCard } from './sortable-card';

type ColumnProps = {
  status: CardStatus;
  name: string;
  cards: Card[];
  filtered: boolean;
  composing: boolean;
  onComposingChange: (open: boolean) => void;
  dragging: boolean;
  /** Cards the agent just created. They rise into place with a teal ring. */
  freshIds: Set<string>;
};

export function Column({
  status,
  name,
  cards,
  filtered,
  composing,
  onComposingChange,
  dragging,
  freshIds,
}: ColumnProps) {
  const { presences, memberById, me, cards: allCards } = useBoard();
  const { setNodeRef } = useDroppable({ id: status });
  const boardIsEmpty = allCards.length === 0;

  const viewersOf = (cardId: string): CardViewer[] =>
    presences
      .filter((presence) => presence.metadata?.cardId === cardId && presence.userId !== me.$id)
      .map((presence) => ({ presence, member: memberById.get(presence.userId)! }))
      .sort((a, b) => Number(b.member.isAgent) - Number(a.member.isAgent));

  return (
    <section
      aria-label={name}
      className="flex w-[85vw] shrink-0 snap-start flex-col rounded-xl border border-border/70 bg-surface md:w-auto md:min-w-60 md:flex-1 md:shrink"
    >
      <header className="flex h-11 shrink-0 items-center gap-2 pr-2 pl-3.5">
        <StatusIcon status={status} className="text-muted" />
        <h2 className="text-13 font-semibold">{name}</h2>
        <span className="tabular text-12 text-subtle">{cards.length}</span>
        <Tooltip content="Add card">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add card to ${name}`}
            className="ml-auto"
            onClick={() => onComposingChange(true)}
          >
            <PlusIcon />
          </Button>
        </Tooltip>
      </header>

      <SortableContext
        id={status}
        items={cards.map((card) => card.$id)}
        strategy={verticalListSortingStrategy}
      >
        <motion.div
          ref={setNodeRef}
          layoutScroll
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pt-3 pb-2"
        >
          {composing && <NewCard status={status} onClose={() => onComposingChange(false)} />}
          {cards.map((card) => (
            <SortableCard
              key={card.$id}
              card={card}
              viewers={viewersOf(card.$id)}
              fresh={freshIds.has(card.$id)}
              animateLayout={!dragging}
            />
          ))}
          {cards.length === 0 && !composing && (
            <EmptyColumn
              status={status}
              filtered={filtered}
              boardIsEmpty={boardIsEmpty}
              onAdd={() => onComposingChange(true)}
            />
          )}
        </motion.div>
      </SortableContext>
    </section>
  );
}

function EmptyColumn({
  status,
  filtered,
  boardIsEmpty,
  onAdd,
}: {
  status: CardStatus;
  filtered: boolean;
  boardIsEmpty: boolean;
  onAdd: () => void;
}) {
  if (filtered) {
    return <p className="px-1.5 py-3 text-12 text-subtle">No matching cards</p>;
  }
  if (status === 'inbox' && boardIsEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-13 text-muted">No cards yet</p>
        <Button size="sm" onClick={onAdd}>
          <PlusIcon />
          Add card
        </Button>
      </div>
    );
  }
  if (status === 'inbox') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-card text-muted">
          <CheckIcon className="size-4" />
        </span>
        <p className="text-13 font-medium text-fg">Inbox is clear</p>
        <p className="text-12 text-subtle">New requests and reports land here.</p>
      </div>
    );
  }
  return <p className="px-1.5 py-3 text-12 text-subtle">No cards</p>;
}
