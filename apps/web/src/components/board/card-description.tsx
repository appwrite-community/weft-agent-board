import { useRef, useState } from 'react';
import { AgentGlyph } from '@/components/brand/logo';
import { Kbd } from '@/components/ui/kbd';
import { Markdown } from '@/components/ui/markdown';
import { Skeleton } from '@/components/ui/skeleton';
import type { Card, Presence } from '@/lib/types';
import { useBoard } from './board-context';
import { EditorNote } from './editor-note';

type CardDescriptionProps = {
  card: Card;
  /** The agent's presence points at this description: it streams in and people can't edit it. */
  agentWriting: boolean;
  editor: Presence | undefined;
  onEditingChange: (editing: boolean) => void;
};

export function CardDescription({
  card,
  agentWriting,
  editor,
  onEditingChange,
}: CardDescriptionProps) {
  const { actions, focusField } = useBoard();
  const [draft, setDraft] = useState<string | null>(null);
  const canceled = useRef(false);
  const editing = draft !== null && !agentWriting;

  const startEditing = () => {
    if (agentWriting) return;
    setDraft(card.description ?? '');
  };

  const finish = () => {
    const description = draft?.trim() ?? '';
    if (!canceled.current && description !== (card.description ?? '')) {
      actions.updateCard(card.$id, { description: description || null });
    }
    canceled.current = false;
    setDraft(null);
    focusField(null);
    onEditingChange(false);
  };

  return (
    <section>
      <h3 className="mb-2 text-12 font-medium text-muted">Description</h3>

      {agentWriting ? (
        <AgentWriting text={card.description ?? ''} />
      ) : editing ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            aria-label="Description"
            placeholder="Write what this card is about. Markdown lists work."
            onFocus={() => {
              focusField('description');
              onEditingChange(true);
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={finish}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                canceled.current = true;
                event.currentTarget.blur();
              }
            }}
            className="field-sizing-content block min-h-36 w-full resize-none rounded-lg border border-border-strong bg-card px-3 py-2.5 text-14 leading-[1.6] text-fg outline-none focus-visible:border-[#4a4a52] focus-visible:outline-none"
          />
          <p className="mt-1.5 flex items-center gap-1 text-11 text-subtle">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
            <span className="ml-0.5">to save,</span>
            <Kbd>Esc</Kbd>
            <span className="ml-0.5">to cancel</span>
          </p>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Edit description"
          onClick={startEditing}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              startEditing();
            }
          }}
          className="-mx-3 cursor-text rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-card/70"
        >
          {card.description ? (
            <Markdown>{card.description}</Markdown>
          ) : (
            <p className="text-14 text-subtle">Add a description…</p>
          )}
        </div>
      )}

      {editor && <EditorNote presence={editor} field="description" />}
    </section>
  );
}

/** Read-only while the agent streams the description in. The text arrives through Realtime. */
function AgentWriting({ text }: { text: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-agent/25 bg-agent/[0.03]">
      <div
        role="status"
        className="flex items-center gap-2 border-b border-agent/15 bg-agent/[0.06] px-3 py-2 text-12 font-medium text-agent"
      >
        <span className="flex size-4 items-center justify-center rounded-[4px] bg-agent text-agent-fg">
          <AgentGlyph className="size-2.5" />
        </span>
        The agent is writing this description
        <span className="ml-auto size-1.5 animate-pulse-dot rounded-full bg-agent" />
      </div>
      <div className="px-3 py-3">
        {text.trim() ? (
          <Markdown streaming>{text}</Markdown>
        ) : (
          <div aria-hidden className="space-y-2.5 py-1">
            <Skeleton className="h-3 w-11/12 bg-agent/10" />
            <Skeleton className="h-3 w-4/5 bg-agent/10" />
            <Skeleton className="h-3 w-3/5 bg-agent/10" />
          </div>
        )}
      </div>
    </div>
  );
}
