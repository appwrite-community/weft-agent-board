import { CornerDownLeftIcon } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Kbd } from '@/components/ui/kbd';
import { columnCards } from '@/lib/board';
import type { CardStatus } from '@/lib/types';
import { useBoard } from './board-context';

/** An inline composer at the top of a column. Enter adds the card, Escape closes it. */
export function NewCard({ status, onClose }: { status: CardStatus; onClose: () => void }) {
  const { cards, actions } = useBoard();
  const [title, setTitle] = useState('');

  const add = () => {
    const text = title.trim();
    if (!text) return onClose();
    const top = columnCards(cards, status)[0];
    actions.createCard({
      title: text.slice(0, 160),
      status,
      position: top ? top.position - 1000 : 1000,
    });
    setTitle('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      add();
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div className="rounded-lg border border-border-strong bg-card p-3 shadow-[0_0_0_3px_rgb(237_237_239/0.05)]">
      <textarea
        autoFocus
        rows={2}
        maxLength={160}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => !title.trim() && onClose()}
        placeholder="Card title"
        aria-label="New card title"
        className="block w-full resize-none bg-transparent text-14 leading-[1.35] font-medium text-fg outline-none placeholder:font-normal focus-visible:outline-none"
      />
      <div className="mt-2 flex items-center justify-between text-11 text-subtle">
        <span className="inline-flex items-center gap-1">
          <Kbd>
            <CornerDownLeftIcon className="size-3" />
          </Kbd>
          to add
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Esc</Kbd> to close
        </span>
      </div>
    </div>
  );
}
