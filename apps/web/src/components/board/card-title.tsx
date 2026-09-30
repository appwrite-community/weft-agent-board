import { useState } from 'react';
import type { Card, Presence } from '@/lib/types';
import { useBoard } from './board-context';
import { EditorNote } from './editor-note';

type CardTitleProps = {
  card: Card;
  editor: Presence | undefined;
  onEditingChange: (editing: boolean) => void;
};

/** The title as a heading-sized input. Saves on Enter or blur; Escape reverts. */
export function CardTitle({ card, editor, onEditingChange }: CardTitleProps) {
  const { actions, focusField } = useBoard();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? card.title;

  const finish = (save: boolean) => {
    const title = value.trim();
    if (save && title && title !== card.title) actions.updateCard(card.$id, { title });
    setDraft(null);
    focusField(null);
    onEditingChange(false);
  };

  return (
    <div>
      <textarea
        rows={1}
        maxLength={160}
        value={value}
        aria-label="Card title"
        onFocus={() => {
          focusField('title');
          onEditingChange(true);
        }}
        onChange={(event) => setDraft(event.target.value.replace(/\n/g, ' '))}
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(null);
            requestAnimationFrame(() => (event.target as HTMLTextAreaElement).blur());
          }
        }}
        className="field-sizing-content -mx-1.5 block w-[calc(100%+12px)] resize-none rounded-md bg-transparent px-1.5 py-0.5 text-20 leading-[1.3] font-semibold tracking-[-0.015em] text-fg transition-colors duration-150 outline-none hover:bg-card/60 focus-visible:bg-card focus-visible:outline-none"
      />
      {editor && <EditorNote presence={editor} field="title" />}
    </div>
  );
}
