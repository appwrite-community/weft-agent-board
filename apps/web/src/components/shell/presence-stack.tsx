import { Avatar } from '@/components/brand/avatar';
import { useBoard } from '@/components/board/board-context';
import { Tooltip } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { describePresence } from '@/lib/presence';
import type { Member } from '@/lib/types';

/** Who is on this board: the agent first, then teammates, then you. */
export function PresenceStack() {
  const { presences, memberById, me, cards } = useBoard();
  const compact = useMediaQuery('(max-width: 767px)');
  const limit = compact ? 3 : 4;

  // On small screens your own avatar is already in the user menu.
  const entries = presences
    .filter((presence) => !compact || presence.userId !== me.$id)
    .map((presence) => ({ presence, member: memberById.get(presence.userId)! }))
    .sort((a, b) => rank(a.member, me.$id) - rank(b.member, me.$id));
  const shown = entries.slice(0, limit);
  const hidden = entries.slice(limit);

  // Alone on the board: nothing to show next to your own avatar.
  if (entries.every(({ presence }) => presence.userId === me.$id)) return null;

  return (
    <ul
      aria-label="On this board"
      className="flex items-center pl-1 [--avatar-gap:var(--color-canvas)]"
    >
      {shown.map(({ presence, member }) => (
        <li key={presence.userId} className="-ml-2 first:ml-0">
          <Tooltip
            content={
              <span>
                <span className="font-medium">
                  {member.userId === me.$id ? 'You' : member.name}
                </span>
                <span className="text-muted"> · {describePresence(presence, member, cards)}</span>
              </span>
            }
          >
            <span tabIndex={0} className="block rounded-full">
              <Avatar member={member} size={28} ring />
            </span>
          </Tooltip>
        </li>
      ))}
      {hidden.length > 0 && (
        <li className="-ml-2">
          <Tooltip content={hidden.map(({ member }) => member.name).join(', ')}>
            <span
              tabIndex={0}
              className="tabular flex h-7 min-w-7 items-center justify-center rounded-full border border-border-strong bg-card px-1.5 text-11 font-medium text-muted shadow-[0_0_0_2px_var(--color-canvas)]"
            >
              +{hidden.length}
            </span>
          </Tooltip>
        </li>
      )}
    </ul>
  );
}

function rank(member: Member, myId: string) {
  if (member.isAgent) return 0;
  return member.userId === myId ? 2 : 1;
}
