import { firstName } from '@/lib/format';
import type { Presence } from '@/lib/types';
import { useBoard } from './board-context';

/** "Theo is editing the description", in Theo's color. Editing stays allowed. */
export function EditorNote({ presence, field }: { presence: Presence; field: string }) {
  const { memberById } = useBoard();
  const member = memberById.get(presence.userId);
  if (!member) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-12" style={{ color: member.color }}>
      <span
        className="size-1.5 animate-pulse-dot rounded-full"
        style={{ background: member.color }}
      />
      {firstName(member.name)} is editing the {field}
    </p>
  );
}
