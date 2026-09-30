import type { Models } from 'appwrite';
import { createContext, useContext } from 'react';
import type { useCardActions } from '@/hooks/use-card-actions';
import type { Board, Card, EditableField, Member, Presence, Run, Step } from '@/lib/types';

export type BoardState = {
  board: Board;
  me: Models.User;
  members: Member[];
  memberById: Map<string, Member>;
  agent: Member | undefined;
  cards: Card[];
  runs: Run[];
  steps: Step[];
  /** Live presences of this board's team, the agent included, on any board. */
  teamPresences: Presence[];
  /** Live presences on this board. */
  presences: Presence[];
  /** The agent's live presence, if it works right now (on any board of the team). */
  agentPresence: Presence | undefined;
  now: number;
  actions: ReturnType<typeof useCardActions>;
  openCard: (cardId: string) => void;
  focusField: (field: EditableField | null) => void;
  dockOpen: boolean;
  setDockOpen: (open: boolean) => void;
  /** The run that the dock expands and scrolls to, for example from a card's attribution. */
  focusedRunId: string | null;
  showRun: (runId: string) => void;
};

export const BoardContext = createContext<BoardState | null>(null);

export function useBoard() {
  const state = useContext(BoardContext);
  if (!state) throw new Error('useBoard must be used inside a board.');
  return state;
}
