import { queryOptions } from '@tanstack/react-query';
import { AppwriteException, Query } from 'appwrite';
import { account, presences, table, tablesDB, teams } from './appwrite';
import { toMembers } from './people';
import type { Board, Card, Presence, Run, Step } from './types';

/** How many runs the dock shows. */
export const RUN_HISTORY = 15;

/** Resolves to null when Appwrite answers 404 (missing, or no read permission). */
async function orNull<T>(request: Promise<T>) {
  try {
    return await request;
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) return null;
    throw err;
  }
}

/** The signed-in user, or null. */
export const accountQuery = queryOptions({
  queryKey: ['account'],
  queryFn: async () => {
    try {
      return await account.get();
    } catch (err) {
      if (err instanceof AppwriteException && err.code === 401) return null;
      throw err;
    }
  },
  staleTime: Infinity,
});

/** Row security returns only the boards of the user's teams. */
export const boardsQuery = queryOptions({
  queryKey: ['boards'],
  queryFn: async () => {
    const { rows } = await tablesDB.listRows<Board>({
      ...table('boards'),
      queries: [Query.orderAsc('$createdAt'), Query.limit(100)],
    });
    return rows;
  },
  staleTime: 60_000,
});

export const boardQuery = (boardId: string) =>
  queryOptions({
    queryKey: ['board', boardId],
    queryFn: () => orNull(tablesDB.getRow<Board>({ ...table('boards'), rowId: boardId })),
    staleTime: 60_000,
  });

export const cardsQuery = (boardId: string) =>
  queryOptions({
    queryKey: ['cards', boardId],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows<Card>({
        ...table('cards'),
        queries: [Query.equal('boardId', [boardId]), Query.orderAsc('position'), Query.limit(200)],
      });
      return rows;
    },
  });

export const runsQuery = (boardId: string) =>
  queryOptions({
    queryKey: ['runs', boardId],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows<Run>({
        ...table('runs'),
        queries: [
          Query.equal('boardId', [boardId]),
          Query.orderDesc('$createdAt'),
          Query.limit(RUN_HISTORY),
        ],
      });
      return rows;
    },
  });

export const stepsQuery = (boardId: string) =>
  queryOptions({
    queryKey: ['steps', boardId],
    queryFn: async () => {
      const { rows } = await tablesDB.listRows<Step>({
        ...table('steps'),
        queries: [
          Query.equal('boardId', [boardId]),
          Query.orderDesc('$createdAt'),
          Query.limit(400),
        ],
      });
      return rows.reverse();
    },
  });

export const membersQuery = (teamId: string) =>
  queryOptions({
    queryKey: ['members', teamId],
    queryFn: async () => {
      const { memberships } = await teams.listMemberships({
        teamId,
        queries: [Query.limit(100)],
      });
      return toMembers(memberships);
    },
    staleTime: 5 * 60_000,
  });

export const teamQuery = (teamId: string) =>
  queryOptions({
    queryKey: ['team', teamId],
    queryFn: () => teams.get({ teamId }),
    staleTime: 5 * 60_000,
  });

/** Card counts for the board switcher. */
export const boardCountsQuery = (boardIds: string[]) =>
  queryOptions({
    queryKey: ['board-counts', boardIds],
    queryFn: async () => {
      const totals = await Promise.all(
        boardIds.map((boardId) =>
          tablesDB
            .listRows({
              ...table('cards'),
              queries: [Query.equal('boardId', [boardId]), Query.limit(1)],
            })
            .then(({ total }) => [boardId, total] as const),
        ),
      );
      return Object.fromEntries(totals) as Record<string, number>;
    },
    staleTime: 30_000,
  });

/** Everyone whose presence the user can read: the people and agents of their teams. */
export const presencesQuery = queryOptions({
  queryKey: ['presences'],
  queryFn: async () => {
    const { presences: list } = await presences.list({ queries: [Query.limit(100)] });
    return list as Presence[];
  },
  staleTime: Infinity,
});
