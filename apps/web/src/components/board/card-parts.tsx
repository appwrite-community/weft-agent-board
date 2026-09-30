import type { SVGProps } from 'react';
import { labelInfo, priorityName } from '@/lib/board';
import type { CardStatus, Label, Priority } from '@/lib/types';
import { cn } from '@/lib/utils';

export function LabelChip({ label, className }: { label: Label; className?: string }) {
  const { name, color } = labelInfo(label);
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md border border-border-strong/70 px-1.5 text-11 font-medium text-muted',
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}

/** Signal bars for low to high, a filled alert for urgent, nothing for none (or empty bars). */
export function PriorityIcon({
  priority,
  className,
  showNone,
}: {
  priority: Priority;
  className?: string;
  /** Draw empty bars for "No priority", for pickers that align an icon column. */
  showNone?: boolean;
}) {
  if (priority === 'none' && !showNone) return null;
  const label = `${priorityName(priority)} priority`;
  if (priority === 'urgent') {
    return (
      <svg
        viewBox="0 0 16 16"
        className={cn('size-4 shrink-0', className)}
        role="img"
        aria-label={label}
      >
        <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" fill="#f87171" />
        <rect x="7.1" y="4.25" width="1.8" height="4.9" rx="0.9" fill="#1c0606" />
        <circle cx="8" cy="11.2" r="1" fill="#1c0606" />
      </svg>
    );
  }
  const level = { none: 0, low: 1, medium: 2, high: 3 }[priority];
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-4 shrink-0', className)}
      role="img"
      aria-label={label}
    >
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={2.5 + bar * 4.25}
          y={10.5 - bar * 3}
          width="2.5"
          height={3 + bar * 3}
          rx="0.75"
          fill={bar < level ? '#ededef' : '#3a3a41'}
        />
      ))}
    </svg>
  );
}

/** Column icons: an inbox, an open circle, a half circle, a check. */
export function StatusIcon({
  status,
  className,
  ...props
}: { status: CardStatus } & SVGProps<SVGSVGElement>) {
  const common = {
    viewBox: '0 0 16 16',
    fill: 'none',
    'aria-hidden': true,
    className: cn('size-4 shrink-0', className),
    ...props,
  };
  switch (status) {
    case 'inbox':
      return (
        <svg {...common}>
          <path
            d="M2.5 9.25 4.2 3.9a1 1 0 0 1 .95-.65h5.7a1 1 0 0 1 .95.65l1.7 5.35v2.75a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9.25Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M2.75 9.25h2.9l.85 1.5h3l.85-1.5h2.9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'next':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'doing':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.4a3.6 3.6 0 0 1 0 7.2V4.4Z" fill="currentColor" />
        </svg>
      );
    case 'done':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.35" fill="currentColor" />
          <path
            d="m5.4 8.1 1.75 1.75L10.7 6.3"
            stroke="#111113"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
