import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

/**
 * Markdown from people and the agent. react-markdown renders no raw HTML,
 * so text from the model can't inject markup.
 */
export function Markdown({
  children,
  streaming,
  className,
}: {
  children: string;
  /** Text is still arriving: a teal caret blinks after the last word. */
  streaming?: boolean;
  className?: string;
}) {
  if (streaming && !children.trim()) return <StreamingCaret />;
  return (
    <div
      className={cn(
        streaming && 'streaming-caret',
        'text-14 leading-[1.6] text-[#d4d4d8] [overflow-wrap:anywhere]',
        '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
        '[&_li]:pl-0.5 [&_li::marker]:text-subtle [&_ul:last-child]:mb-0',
        '[&_strong]:font-semibold [&_strong]:text-fg [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-2',
        '[&_code]:rounded [&_code]:bg-card [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-12',
        '[&_h1]:text-14 [&_h1]:font-semibold [&_h2]:text-14 [&_h2]:font-semibold [&_h3]:text-14 [&_h3]:font-semibold',
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

function StreamingCaret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-caret rounded-full bg-agent"
    />
  );
}
