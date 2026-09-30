import { CircleDashedIcon } from 'lucide-react';
import { initials } from '@/lib/format';
import type { Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AgentGlyph } from './logo';

type AvatarProps = {
  member: Member | undefined;
  size?: number;
  /** Draws the presence ring in the member's color. */
  ring?: boolean;
  className?: string;
};

/** People are circles; the agent is a teal rounded square. */
export function Avatar({ member, size = 24, ring = false, className }: AvatarProps) {
  if (!member) return <UnassignedAvatar size={size} className={className} />;
  if (member.isAgent) return <AgentAvatar size={size} ring={ring} className={className} />;

  const fontSize = Math.max(8, Math.round(size * 0.4));
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[-0.01em] select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        color: `color-mix(in srgb, ${member.color} 72%, white)`,
        background: `color-mix(in srgb, ${member.color} 20%, #16161a)`,
        boxShadow: ring
          ? `0 0 0 2px var(--avatar-gap, #0a0a0b), 0 0 0 4px ${member.color}`
          : `inset 0 0 0 1px color-mix(in srgb, ${member.color} 28%, transparent)`,
      }}
      aria-label={member.name}
      role="img"
    >
      {initials(member.name)}
    </span>
  );
}

export function AgentAvatar({
  size = 24,
  ring = false,
  className,
}: {
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-agent text-agent-fg select-none',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        boxShadow: ring
          ? '0 0 0 2px var(--avatar-gap, #0a0a0b), 0 0 0 4px rgb(45 212 191 / 0.45), 0 0 14px 2px rgb(45 212 191 / 0.3)'
          : undefined,
      }}
      aria-label="Weft Agent"
      role="img"
    >
      <AgentGlyph className="size-[62%]" />
    </span>
  );
}

function UnassignedAvatar({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center text-[#5f5f67]', className)}
      style={{ width: size, height: size }}
      aria-label="Unassigned"
      role="img"
    >
      <CircleDashedIcon style={{ width: size, height: size }} strokeWidth={1.5} />
    </span>
  );
}
