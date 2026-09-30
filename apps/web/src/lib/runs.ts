import type { Card, Run, RunStatus } from './types';

export const OPEN_STATUSES: RunStatus[] = ['queued', 'running'];
export const isOpen = (run: Run) => OPEN_STATUSES.includes(run.status);

/** The run as a sentence, for example "Split “Show gate changes…” into subtasks". */
export function runTitle(run: Run, cards: Card[]) {
  const card = cards.find((item) => item.$id === run.cardId);
  const cardTitle = card ? `“${card.title}”` : 'a deleted card';
  switch (run.kind) {
    case 'triage':
      return 'Triage the inbox';
    case 'split':
      return `Split ${cardTitle} into subtasks`;
    case 'draft':
      return `Draft the description of ${cardTitle}`;
    case 'summary':
      return 'Write a standup summary';
    case 'ask':
      return run.prompt ?? 'Request';
  }
}

/** Newest first; the dock pulls running and queued runs to the top itself. */
export const sortRuns = (runs: Run[]) =>
  [...runs].sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
