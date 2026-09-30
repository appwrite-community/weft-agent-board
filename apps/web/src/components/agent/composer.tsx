import { ArrowUpIcon, InboxIcon, NotebookPenIcon } from 'lucide-react';
import type { RefObject } from 'react';
import { useBoard } from '@/components/board/board-context';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { useAgentRequest } from '@/hooks/use-agent-request';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 1000;

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export function Composer({ value, onChange, inputRef }: ComposerProps) {
  const { board, cards } = useBoard();
  const { request, busy } = useAgentRequest({
    onSent: ({ kind }) => kind === 'ask' && onChange(''),
  });
  const inboxCount = cards.filter((card) => card.status === 'inbox').length;
  const prompt = value.trim();
  const canSend = !!prompt && value.length <= MAX_LENGTH && !busy;

  const send = () => {
    if (canSend) request({ boardId: board.$id, kind: 'ask', prompt });
  };

  return (
    <div className="space-y-2.5">
      <div
        className={cn(
          'rounded-xl border border-border-strong bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-[#4a4a52] focus-within:shadow-[0_0_0_3px_rgb(237_237_239/0.06)]',
          busy && 'opacity-70',
        )}
      >
        <textarea
          ref={inputRef}
          value={value}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Ask the agent to change this board"
          aria-label="Ask the agent"
          className="field-sizing-content block max-h-[calc(6lh+20px)] min-h-[calc(3lh+20px)] w-full resize-none bg-transparent px-3 pt-2.5 pb-2 text-13 leading-[1.5] text-fg outline-none focus-visible:outline-none disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-end gap-2 px-2 pb-2">
          {value.length > 900 && (
            <span
              className={cn(
                'tabular font-mono text-11',
                value.length > MAX_LENGTH ? 'text-danger' : 'text-subtle',
              )}
            >
              {value.length}/{MAX_LENGTH}
            </span>
          )}
          <Tooltip content="Send (⌘↵)">
            <Button
              variant="primary"
              size="icon-sm"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className="rounded-lg"
            >
              {busy ? <Spinner /> : <ArrowUpIcon />}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tooltip content={inboxCount === 0 ? 'The inbox is empty' : null} wrap={inboxCount === 0}>
          <Button
            size="sm"
            disabled={busy || inboxCount === 0}
            onClick={() => request({ boardId: board.$id, kind: 'triage' })}
          >
            <InboxIcon />
            Triage inbox
            <span className="tabular text-subtle">{inboxCount}</span>
          </Button>
        </Tooltip>
        <Button
          size="sm"
          disabled={busy}
          onClick={() => request({ boardId: board.$id, kind: 'summary' })}
        >
          <NotebookPenIcon />
          Standup summary
        </Button>
      </div>
    </div>
  );
}
