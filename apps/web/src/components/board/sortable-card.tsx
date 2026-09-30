import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowRightLeftIcon,
  FileTextIcon,
  LinkIcon,
  PanelRightOpenIcon,
  SplitIcon,
  Trash2Icon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/menu';
import { useAgentRequest } from '@/hooks/use-agent-request';
import { COLUMNS, columnCards } from '@/lib/board';
import type { Card } from '@/lib/types';
import { useBoard } from './board-context';
import { CardTile, type CardViewer } from './card-tile';
import { DeleteCardDialog } from './delete-card-dialog';

type SortableCardProps = {
  card: Card;
  viewers: CardViewer[];
  fresh: boolean;
  /** Layout animations run only when no card is being dragged. */
  animateLayout: boolean;
};

export function SortableCard({ card, viewers, fresh, animateLayout }: SortableCardProps) {
  const { openCard, cards, actions, board } = useBoard();
  const { request, busy } = useAgentRequest();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.$id,
    data: { status: card.status },
  });

  const moveTo = (status: Card['status']) => {
    const top = columnCards(cards, status)[0];
    actions.updateCard(card.$id, {
      status,
      position: top ? top.position - 1000 : 1000,
    });
  };

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ card: card.$id }).toString();
    await navigator.clipboard.writeText(url.toString());
    toast('Link copied');
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            layout={animateLayout ? 'position' : false}
            layoutId={animateLayout ? card.$id : undefined}
            initial={fresh ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          >
            <div
              ref={setNodeRef}
              style={{ transform: CSS.Translate.toString(transform), transition }}
              {...attributes}
              {...listeners}
              aria-roledescription="card"
              aria-label={card.title}
              onClick={() => openCard(card.$id)}
              onKeyDown={(event) => {
                listeners?.onKeyDown?.(event);
                if (event.key === 'Enter' && !event.defaultPrevented) openCard(card.$id);
              }}
              className="rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(237_237_239/0.6)]"
            >
              {isDragging ? (
                // Keeps the card's height where it will land.
                <div className="rounded-lg border border-dashed border-border-strong bg-card/40">
                  <CardTile card={card} className="invisible border-0" />
                </div>
              ) : (
                <CardTile card={card} viewers={viewers} fresh={fresh} />
              )}
            </div>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onSelect={() => openCard(card.$id)}>
            <PanelRightOpenIcon />
            Open card
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ArrowRightLeftIcon />
              Move to
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {COLUMNS.map((column) => (
                <ContextMenuItem
                  key={column.status}
                  disabled={column.status === card.status}
                  onSelect={() => moveTo(column.status)}
                >
                  {column.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem onSelect={copyLink}>
            <LinkIcon />
            Copy link
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Ask the agent</ContextMenuLabel>
          <ContextMenuItem
            disabled={busy}
            onSelect={() => request({ boardId: board.$id, kind: 'split', cardId: card.$id })}
          >
            <SplitIcon />
            Split into subtasks
          </ContextMenuItem>
          <ContextMenuItem
            disabled={busy}
            onSelect={() => request({ boardId: board.$id, kind: 'draft', cardId: card.$id })}
          >
            <FileTextIcon />
            Draft description
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => setConfirmDelete(true)}>
            <Trash2Icon />
            Delete card
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <DeleteCardDialog card={card} open={confirmDelete} onOpenChange={setConfirmDelete} />
    </>
  );
}
