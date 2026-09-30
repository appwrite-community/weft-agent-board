import type { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo';

/** A centered page for states without a board: no access, no boards yet. */
export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="dotted-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,black,transparent)]"
      />
      <main className="relative flex w-full max-w-96 flex-col items-center text-center">
        <LogoMark size={36} />
        <h1 className="mt-6 text-20 font-semibold tracking-[-0.01em]">{title}</h1>
        <p className="mt-2 text-14 text-muted">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </main>
    </div>
  );
}
