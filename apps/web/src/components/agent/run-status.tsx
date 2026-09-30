import { CheckIcon, CircleSlashIcon, ClockIcon, TriangleAlertIcon } from 'lucide-react';
import type { RunStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS: Record<RunStatus, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'border-border-strong text-muted' },
  running: { label: 'Working', className: 'border-agent/30 bg-agent/10 text-agent' },
  done: { label: 'Done', className: 'border-border-strong text-muted' },
  failed: { label: 'Failed', className: 'border-danger/30 bg-danger/10 text-danger' },
  stopped: { label: 'Stopped', className: 'border-border-strong text-muted' },
};

export function RunStatusChip({ status, className }: { status: RunStatus; className?: string }) {
  const { label, className: tone } = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-11 font-medium [&_svg]:size-3',
        tone,
        className,
      )}
    >
      {status === 'running' && (
        <span className="size-1.5 animate-pulse-dot rounded-full bg-agent" />
      )}
      {status === 'queued' && <ClockIcon />}
      {status === 'done' && <CheckIcon />}
      {status === 'failed' && <TriangleAlertIcon />}
      {status === 'stopped' && <CircleSlashIcon />}
      {label}
    </span>
  );
}
