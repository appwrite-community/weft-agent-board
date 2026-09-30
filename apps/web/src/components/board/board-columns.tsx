import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { LayoutGroup } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { COLUMN_NAMES, COLUMNS, columnCards, positionBetween } from '@/lib/board';
import type { Card, CardStatus } from '@/lib/types';
import { useBoard } from './board-context';
import { CardTile } from './card-tile';
import { Column } from './column';

type Layout = Record<CardStatus, string[]>;

const toLayout = (cards: Card[]): Layout =>
  Object.fromEntries(
    COLUMNS.map(({ status }) => [status, columnCards(cards, status).map((card) => card.$id)]),
  ) as Layout;

const findColumn = (layout: Layout, id: string) =>
  (id in layout ? id : COLUMNS.find(({ status }) => layout[status].includes(id))?.status) as
    CardStatus | undefined;

const isColumn = (id: unknown): id is CardStatus => COLUMNS.some(({ status }) => status === id);

/**
 * Finds the column under the pointer (or under the card, for keyboard drags),
 * then the closest card in it. An empty column is a drop target on its own.
 */
const findTarget: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  const column = hits
    .map(({ id, data }) =>
      isColumn(id) ? id : data?.droppableContainer?.data.current?.sortable?.containerId,
    )
    .find(isColumn);
  if (!column) return closestCorners(args);

  const cards = args.droppableContainers.filter(
    (container) => container.data.current?.sortable?.containerId === column,
  );
  const closest = closestCenter({ ...args, droppableContainers: cards });
  return closest.length > 0 ? closest : [{ id: column }];
};

/**
 * Left and right arrows move a picked-up card to the top of the next column,
 * empty or not. Up and down reorder inside the column.
 */
const coordinateGetter: KeyboardCoordinateGetter = (event, args) => {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.code];
  if (!step) return sortableKeyboardCoordinates(event, args);
  event.preventDefault();
  const { active, over, droppableRects } = args.context;
  const current = over ?? active;
  const from = isColumn(current?.id) ? current.id : current?.data.current?.sortable?.containerId;
  const next = COLUMNS[COLUMNS.findIndex(({ status }) => status === from) + step];
  const rect = next && droppableRects.get(next.status);
  return rect ? { x: rect.left + 8, y: rect.top + 12 } : undefined;
};

/**
 * Right after a card moves to another column, the columns are still being
 * measured. Keeping the last target for one frame stops the card from
 * bouncing between two columns.
 */
function useColumnCollisions(layout: Layout | null) {
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const movedToNewColumn = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => (movedToNewColumn.current = false));
    return () => cancelAnimationFrame(frame);
  }, [layout]);

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (movedToNewColumn.current && lastOverId.current !== null) {
      return [{ id: lastOverId.current }];
    }
    const collisions = findTarget(args);
    lastOverId.current = collisions[0]?.id ?? null;
    return collisions;
  }, []);

  return { collisionDetection, markMoved: () => (movedToNewColumn.current = true) };
}

type BoardColumnsProps = {
  search: string;
  composerColumn: CardStatus | null;
  onComposerColumnChange: (status: CardStatus | null) => void;
};

export function BoardColumns({
  search,
  composerColumn,
  onComposerColumnChange,
}: BoardColumnsProps) {
  const { cards, actions, agent } = useBoard();
  const query = search.trim().toLowerCase();
  const visible = query ? cards.filter((card) => card.title.toLowerCase().includes(query)) : cards;
  const cardById = new Map(cards.map((card) => [card.$id, card]));

  // While a card is dragged, the layout lives here; the drop writes it to Appwrite.
  const [dragLayout, setDragLayout] = useState<Layout | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const layout = dragLayout ?? toLayout(visible);
  const activeCard = activeId ? cardById.get(activeId) : undefined;
  const { collisionDetection, markMoved } = useColumnCollisions(dragLayout);

  const freshIds = useFreshAgentCards(cards, agent?.userId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDragLayout(toLayout(visible));
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !dragLayout) return;
    const from = findColumn(dragLayout, String(active.id));
    const to = findColumn(dragLayout, String(over.id));
    if (!from || !to || from === to) return;
    markMoved();
    setDragLayout((current) => {
      if (!current) return current;
      const target = current[to];
      const overIndex = target.indexOf(String(over.id));
      const index = overIndex === -1 ? target.length : overIndex;
      return {
        ...current,
        [from]: current[from].filter((id) => id !== active.id),
        [to]: [...target.slice(0, index), String(active.id), ...target.slice(index)],
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const card = cardById.get(String(active.id));
    const current = dragLayout;
    setActiveId(null);
    setDragLayout(null);
    if (!card || !over || !current) return;

    const status = findColumn(current, String(active.id));
    if (!status) return;
    let ids = current[status];
    const overIndex = ids.indexOf(String(over.id));
    const fromIndex = ids.indexOf(card.$id);
    if (overIndex !== -1 && overIndex !== fromIndex) ids = arrayMove(ids, fromIndex, overIndex);

    const index = ids.indexOf(card.$id);
    const before = cardById.get(ids[index - 1]);
    const after = cardById.get(ids[index + 1]);
    const unchanged =
      status === card.status &&
      (!before || before.position < card.position) &&
      (!after || after.position > card.position);
    if (unchanged) return;

    actions.updateCard(card.$id, { status, position: positionBetween(before, after) });
    if (status !== card.status) toast(`Moved to ${COLUMN_NAMES[status]}`, { duration: 2000 });
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${cardById.get(String(active.id))?.title}.`,
    onDragOver: ({ over }) =>
      over ? `Over ${COLUMN_NAMES[findColumn(layout, String(over.id)) ?? 'inbox']}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${cardById.get(String(active.id))?.title} in ${COLUMN_NAMES[findColumn(layout, String(over.id)) ?? 'inbox']}.`
        : 'Drag canceled.',
    onDragCancel: () => 'Drag canceled.',
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragLayout(null);
      }}
      accessibility={{ announcements }}
    >
      <LayoutGroup>
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:snap-none md:px-5 md:pb-5">
          {COLUMNS.map(({ status, name }) => (
            <Column
              key={status}
              status={status}
              name={name}
              cards={layout[status].map((id) => cardById.get(id)).filter((card) => !!card)}
              filtered={!!query}
              composing={composerColumn === status}
              onComposingChange={(open) => onComposerColumnChange(open ? status : null)}
              dragging={activeId !== null}
              freshIds={freshIds}
            />
          ))}
        </div>
      </LayoutGroup>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeCard && <CardTile card={activeCard} lifted />}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Cards the agent created after the board opened. They stay fresh for the
 * length of their entrance, so a card that moves later does not animate again.
 */
function useFreshAgentCards(cards: Card[], agentId: string | undefined) {
  const [seen, setSeen] = useState(() => new Set(cards.map((card) => card.$id)));
  const fresh = cards
    .filter((card) => !seen.has(card.$id) && card.createdBy === agentId)
    .map((card) => card.$id);
  const freshKey = fresh.join(',');

  useEffect(() => {
    if (!freshKey) return;
    const timer = setTimeout(
      () => setSeen((current) => new Set([...current, ...freshKey.split(',')])),
      1500,
    );
    return () => clearTimeout(timer);
  }, [freshKey]);

  return new Set(fresh);
}
