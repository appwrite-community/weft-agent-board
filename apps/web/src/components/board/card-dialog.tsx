import {
  FileTextIcon,
  LinkIcon,
  MoreHorizontalIcon,
  SparklesIcon,
  SplitIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/brand/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/menu';
import { Tooltip } from '@/components/ui/tooltip';
import { useAgentRequest } from '@/hooks/use-agent-request';
import { COLUMN_NAMES } from '@/lib/board';
import { describePresence } from '@/lib/presence';
import type { Card, Presence } from '@/lib/types';
import { useBoard } from './board-context';
import { CardDescription } from './card-description';
import { CardProperties } from './card-properties';
import { StatusIcon } from './card-parts';
import { CardTitle } from './card-title';
import { DeleteCardDialog } from './delete-card-dialog';

export function CardDialog({ cardId, onClose }: { cardId: string | null; onClose: () => void }) {
  const { cards } = useBoard();
  const card = cards.find((item) => item.$id === cardId);
  const [editing, setEditing] = useState(false);

  return (
    <Dialog open={!!cardId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[min(88dvh,720px)] max-w-[760px] flex-col overflow-hidden"
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself, not the title: focusing a field announces "editing".
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
        // Escape first leaves a field that is being edited.
        onEscapeKeyDown={(event) => editing && event.preventDefault()}
      >
        {card ? (
          <CardDetails card={card} onClose={onClose} onEditingChange={setEditing} />
        ) : (
          <DeletedCard />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeletedCard() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-card text-muted">
        <Trash2Icon className="size-4.5" />
      </span>
      <DialogTitle className="mt-4 text-16 font-semibold">This card was deleted</DialogTitle>
      <DialogDescription className="mt-1.5 text-13 text-muted">
        Someone on the board deleted it while you had it open.
      </DialogDescription>
      <DialogClose asChild>
        <Button className="mt-6">Close</Button>
      </DialogClose>
    </div>
  );
}

type CardDetailsProps = {
  card: Card;
  onClose: () => void;
  onEditingChange: (editing: boolean) => void;
};

function CardDetails({ card, onClose, onEditingChange }: CardDetailsProps) {
  const { board, presences, memberById, me, cards, agentPresence, openCard } = useBoard();
  const { request, busy } = useAgentRequest();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const viewers = presences.filter((presence) => presence.metadata?.cardId === card.$id);
  const agentWriting =
    agentPresence?.metadata?.cardId === card.$id && agentPresence.metadata.field === 'description';
  const editorOf = (field: 'title' | 'description') =>
    viewers.find(
      (presence) =>
        presence.userId !== me.$id &&
        presence.status === 'editing' &&
        presence.metadata?.field === field &&
        !memberById.get(presence.userId)?.isAgent,
    );
  const subtasks = cards
    .filter((item) => item.parentId === card.$id)
    .sort((a, b) => a.position - b.position);
  const parent = card.parentId ? cards.find((item) => item.$id === card.parentId) : undefined;

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast('Link copied');
  };

  return (
    <>
      <DialogTitle className="sr-only">{card.title}</DialogTitle>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border pr-3 pl-5">
        <nav
          aria-label="Card location"
          className="flex min-w-0 items-center gap-1.5 text-13 text-muted"
        >
          <span className="truncate">{board.name}</span>
          <span aria-hidden className="text-[#46464d]">
            /
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-fg">
            <StatusIcon status={card.status} className="size-3.5 text-muted" />
            {COLUMN_NAMES[card.status]}
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewers.length > 0 && <Viewers viewers={viewers} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={copyLink}>
                <LinkIcon />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmDelete(true)}>
                <Trash2Icon />
                Delete card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogCloseButton />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_240px] md:overflow-hidden">
        <div className="min-w-0 space-y-6 px-6 pt-5 pb-6 md:overflow-y-auto">
          <div>
            {parent && (
              <button
                type="button"
                onClick={() => openCard(parent.$id)}
                className="mb-2 inline-flex max-w-full items-center gap-1.5 text-12 text-subtle hover:text-fg"
              >
                <SplitIcon className="size-3.5 shrink-0" />
                <span className="truncate">Subtask of {parent.title}</span>
              </button>
            )}
            <CardTitle card={card} editor={editorOf('title')} onEditingChange={onEditingChange} />
          </div>

          <CardDescription
            card={card}
            agentWriting={agentWriting}
            editor={editorOf('description')}
            onEditingChange={onEditingChange}
          />

          {subtasks.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-12 font-medium text-muted">
                Subtasks
                <span className="tabular text-subtle">
                  {subtasks.filter((item) => item.status === 'done').length}/{subtasks.length}
                </span>
              </h3>
              <ul className="overflow-hidden rounded-lg border border-border">
                {subtasks.map((subtask) => (
                  <li key={subtask.$id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openCard(subtask.$id)}
                      className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-13 transition-colors duration-150 hover:bg-card-hover"
                    >
                      <StatusIcon status={subtask.status} className="size-3.5 text-muted" />
                      <span className="min-w-0 flex-1 truncate">{subtask.title}</span>
                      <Avatar
                        member={subtask.assigneeId ? memberById.get(subtask.assigneeId) : undefined}
                        size={18}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
            <span className="mr-1 inline-flex items-center gap-1.5 text-12 font-medium text-muted">
              <SparklesIcon className="size-3.5 text-agent" />
              Ask the agent
            </span>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => request({ boardId: board.$id, kind: 'split', cardId: card.$id })}
            >
              <SplitIcon />
              Split into subtasks
            </Button>
            <Tooltip
              wrap={agentWriting}
              content={agentWriting ? 'The agent is already writing this description' : null}
            >
              <Button
                size="sm"
                disabled={busy || agentWriting}
                onClick={() => request({ boardId: board.$id, kind: 'draft', cardId: card.$id })}
              >
                <FileTextIcon />
                Draft description
              </Button>
            </Tooltip>
          </section>
        </div>

        <aside className="border-t border-border bg-surface/60 px-4 pt-4 pb-5 md:overflow-y-auto md:border-t-0 md:border-l">
          <CardProperties card={card} />
        </aside>
      </div>

      <DeleteCardDialog
        card={card}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onDeleted={onClose}
      />
    </>
  );
}

function Viewers({ viewers }: { viewers: Presence[] }) {
  const { memberById, me, cards } = useBoard();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-12 text-subtle sm:inline">Viewing</span>
      <ul className="flex items-center [--avatar-gap:var(--color-popover)]">
        {viewers.map((presence) => {
          const member = memberById.get(presence.userId)!;
          return (
            <li key={presence.userId} className="-ml-1.5 first:ml-0">
              <Tooltip
                content={`${member.userId === me.$id ? 'You' : member.name} · ${describePresence(presence, member, cards)}`}
              >
                <span tabIndex={0} className="block rounded-full">
                  <Avatar member={member} size={22} ring />
                </span>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
