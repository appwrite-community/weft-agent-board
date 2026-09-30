import type { Card, Member, Presence } from './types';

/** What a presence says, for example "viewing Offline boarding passes". */
export function describePresence(presence: Presence, member: Member, cards: Card[]) {
  const metadata = presence.metadata ?? {};
  if (member.isAgent) return metadata.activity ?? 'Working';
  const card = cards.find((item) => item.$id === metadata.cardId);
  if (!card) return 'viewing the board';
  if (presence.status === 'editing' && metadata.field) {
    return `editing the ${metadata.field} of ${card.title}`;
  }
  return `viewing ${card.title}`;
}

/** The agent's activity as one verb for its name tag: "Triaging 3 of 6 cards" becomes "triaging". */
export const activityVerb = (activity: string | null | undefined) =>
  activity?.split(' ')[0]?.toLowerCase() ?? 'working';
