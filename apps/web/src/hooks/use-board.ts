import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Channel, Query, type RealtimeResponseEvent } from 'appwrite';
import { useEffect } from 'react';
import { DATABASE_ID, realtime } from '@/lib/appwrite';
import type { Card, Run, Step } from '@/lib/types';

type BoardRow = Card | Run | Step;

/**
 * Keeps the board live for everyone on it. One subscription covers the
 * cards, runs, and steps tables, and the query makes Appwrite send only the
 * rows of this board.
 */
export function useBoardRealtime(boardId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = ['cards', 'runs', 'steps'].map((tableId) =>
      Channel.tablesdb(DATABASE_ID).table(tableId).row(),
    );
    const subscription = realtime.subscribe(
      channels,
      (event: RealtimeResponseEvent<BoardRow>) => applyRowEvent(queryClient, boardId, event),
      [Query.equal('boardId', [boardId])],
    );
    return () => {
      subscription.then(({ unsubscribe }) => unsubscribe());
    };
  }, [boardId, queryClient]);
}

/** Patches the cached rows of one table with a create, update, or delete event. */
function applyRowEvent(
  queryClient: QueryClient,
  boardId: string,
  { events, payload }: RealtimeResponseEvent<BoardRow>,
) {
  // Events also carry legacy `databases.*` names; the `tablesdb.*` name ends with the action.
  const action = events
    .find((name) => name.startsWith('tablesdb.'))
    ?.split('.')
    .at(-1);
  if (!action) return;

  queryClient.setQueryData<BoardRow[]>([payload.$tableId, boardId], (rows) => {
    if (!rows) return rows;
    if (action === 'delete') return rows.filter((row) => row.$id !== payload.$id);

    const current = rows.find((row) => row.$id === payload.$id);
    if (!current) return payload.$tableId === 'runs' ? [payload, ...rows] : [...rows, payload];
    // Events can arrive out of order. Keep the newest version of the row.
    if (current.$updatedAt > payload.$updatedAt) return rows;
    return rows.map((row) => (row.$id === payload.$id ? payload : row));
  });
}
