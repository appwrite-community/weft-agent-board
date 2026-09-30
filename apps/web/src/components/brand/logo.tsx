import { cn } from '@/lib/utils';

const PAPER = '#141417';
const THREAD = '#ededef';
const TEAL = '#2dd4bf';

/**
 * Two warp threads (vertical) and two weft threads (horizontal) that cross
 * over and under. The lower weft thread is the agent, in teal. A crossing is
 * drawn by repainting the upper thread over a halo in the tile color.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  const over = (x1: number, y1: number, x2: number, y2: number, color: string) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAPER} strokeWidth={5} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
    </>
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <rect x={0.5} y={0.5} width={23} height={23} rx={6} fill={PAPER} stroke="#2a2a30" />
      <g strokeLinecap="round">
        <line x1={6} y1={9} x2={18} y2={9} stroke={THREAD} strokeWidth={2} />
        <line x1={6} y1={15} x2={18} y2={15} stroke={TEAL} strokeWidth={2} />
        <line x1={9} y1={6} x2={9} y2={18} stroke={THREAD} strokeWidth={2} />
        <line x1={15} y1={6} x2={15} y2={18} stroke={THREAD} strokeWidth={2} />
      </g>
      {/* Weft over warp at (9, 9) and (15, 15); warp over weft at (15, 9) and (9, 15). */}
      {over(6.5, 9, 11.5, 9, THREAD)}
      {over(12.5, 15, 17.5, 15, TEAL)}
      {over(15, 6.5, 15, 11.5, THREAD)}
      {over(9, 12.5, 9, 17.5, THREAD)}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('text-16 leading-none font-semibold tracking-[-0.02em] text-fg', className)}
    >
      weft
    </span>
  );
}

/** The agent's glyph: a four-point spark. Always drawn on teal. */
export function AgentGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={cn('shrink-0', className)}>
      <path d="M8 1.5c.35 3.1 1.9 4.65 5 5-3.1.35-4.65 1.9-5 5-.35-3.1-1.9-4.65-5-5 3.1-.35 4.65-1.9 5-5Z" />
      <path d="M12.75 10.25c.12 1.05.65 1.58 1.75 1.75-1.1.17-1.63.7-1.75 1.75-.12-1.05-.65-1.58-1.75-1.75 1.1-.17 1.63-.7 1.75-1.75Z" />
    </svg>
  );
}
