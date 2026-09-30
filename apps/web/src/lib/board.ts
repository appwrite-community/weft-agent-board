import type { Card, CardStatus, Label, Priority } from './types';

export const COLUMNS: { status: CardStatus; name: string }[] = [
  { status: 'inbox', name: 'Inbox' },
  { status: 'next', name: 'Up next' },
  { status: 'doing', name: 'In progress' },
  { status: 'done', name: 'Done' },
];

export const COLUMN_NAMES: Record<CardStatus, string> = {
  inbox: 'Inbox',
  next: 'Up next',
  doing: 'In progress',
  done: 'Done',
};

export const PRIORITIES: { value: Priority; name: string }[] = [
  { value: 'urgent', name: 'Urgent' },
  { value: 'high', name: 'High' },
  { value: 'medium', name: 'Medium' },
  { value: 'low', name: 'Low' },
  { value: 'none', name: 'No priority' },
];

export const LABELS: { value: Label; name: string; color: string }[] = [
  { value: 'bug', name: 'Bug', color: '#f87171' },
  { value: 'feature', name: 'Feature', color: '#60a5fa' },
  { value: 'design', name: 'Design', color: '#f472b6' },
  { value: 'ops', name: 'Ops', color: '#a1a1aa' },
  { value: 'qa', name: 'QA', color: '#fbbf24' },
];

export const labelInfo = (label: Label) => LABELS.find((item) => item.value === label)!;
export const priorityName = (priority: Priority) =>
  PRIORITIES.find((item) => item.value === priority)!.name;

/** Cards of one column in board order. */
export function columnCards(cards: Card[], status: CardStatus) {
  return cards.filter((card) => card.status === status).sort((a, b) => a.position - b.position);
}

/**
 * Positions are fractional, so a card can land between two others with one
 * write. The seed and the agent space cards 1000 apart.
 */
export function positionBetween(before: Card | undefined, after: Card | undefined) {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1000;
  if (after) return after.position - 1000;
  return 1000;
}
