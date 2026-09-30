import type { Models } from 'appwrite';
import type { Member } from './types';

/** Presence colors, given to people by the order they joined the team. */
export const PERSON_COLORS = ['#38bdf8', '#fbbf24', '#fb7185', '#a78bfa', '#a3e635', '#fb923c'];
export const AGENT_COLOR = '#2dd4bf';

/** The agent is the team member with the role `agent`. */
export const AGENT_ROLE = 'agent';

export function toMembers(memberships: Models.Membership[]): Member[] {
  const confirmed = memberships
    .filter((membership) => membership.confirm)
    .sort((a, b) => a.$createdAt.localeCompare(b.$createdAt));

  let personIndex = 0;
  return confirmed.map((membership) => {
    const isAgent = membership.roles.includes(AGENT_ROLE);
    return {
      userId: membership.userId,
      name: membership.userName || (isAgent ? 'Weft Agent' : 'Teammate'),
      isAgent,
      color: isAgent ? AGENT_COLOR : PERSON_COLORS[personIndex++ % PERSON_COLORS.length],
    };
  });
}
