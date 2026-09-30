import { LogoMark } from '@/components/brand/logo';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_HEIGHTS = [
  [92, 76, 108],
  [108, 92, 76],
  [76, 108, 92],
  [92, 76, 76],
];

/** The board's shape while its data loads on the first visit. */
export function BoardSkeleton() {
  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      aria-busy="true"
      aria-label="Loading the board"
    >
      <header className="flex h-13 shrink-0 items-center gap-3 border-b border-border pr-3 pl-4">
        <LogoMark size={22} className="opacity-60" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="ml-3 hidden h-8 w-60 rounded-lg md:block" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="-ml-3 size-7 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 flex-col justify-center gap-2 px-5">
            <Skeleton className="h-4.5 w-44" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex min-h-0 flex-1 gap-3 overflow-hidden px-4 pb-4 md:px-5 md:pb-5">
            {CARD_HEIGHTS.map((heights, column) => (
              <section
                key={column}
                className="flex w-[85vw] shrink-0 flex-col rounded-xl border border-border/70 bg-surface md:w-auto md:min-w-60 md:flex-1 md:shrink"
              >
                <div className="flex h-11 items-center gap-2 px-3.5">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="space-y-2 px-2 pt-3">
                  {heights.map((height, index) => (
                    <div
                      key={index}
                      className="space-y-2.5 rounded-lg border border-border bg-card p-3"
                      style={{ height }}
                    >
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                      {height > 90 && <Skeleton className="size-5 rounded-full" />}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
        <aside className="hidden w-95 shrink-0 flex-col border-l border-border bg-surface md:flex">
          <div className="flex h-16 items-center gap-3 px-4">
            <Skeleton className="size-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="space-y-2.5 border-b border-border px-4 pb-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-7 w-32 rounded-lg" />
            </div>
          </div>
          <div className="space-y-3 px-4 pt-4">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-2.5">
                <Skeleton className="size-4" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-2.5 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
