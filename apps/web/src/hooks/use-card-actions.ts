import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppwriteException, ID, Permission, Role } from 'appwrite';
import { toast } from 'sonner';
import { table, tablesDB } from '@/lib/appwrite';
import { cardsQuery } from '@/lib/queries';
import type { Card } from '@/lib/types';

type CardChanges = Partial<
  Pick<
    Card,
    'title' | 'description' | 'status' | 'position' | 'priority' | 'label' | 'assigneeId' | 'dueAt'
  >
>;

type NewCard = Pick<Card, 'title' | 'status' | 'position'> & { parentId?: string };

function saveError(err: unknown) {
  const offline =
    !navigator.onLine ||
    (err instanceof AppwriteException && err.code === 0) ||
    err instanceof TypeError;
  toast.error(
    offline ? "You're offline. Reconnect and try again." : "Couldn't save the card. Try again.",
  );
}

/**
 * People's card writes. Each write updates the cache right away and is then
 * confirmed by the Realtime event that everyone on the board receives.
 * A person's change clears `runId`, so the card no longer shows the agent as
 * its last editor.
 */
export function useCardActions({
  boardId,
  teamId,
  userId,
}: {
  boardId: string;
  teamId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const key = cardsQuery(boardId).queryKey;

  const patchCache = (update: (cards: Card[]) => Card[]) => {
    const previous = queryClient.getQueryData<Card[]>(key);
    queryClient.setQueryData<Card[]>(key, (cards) => (cards ? update(cards) : cards));
    return previous;
  };
  const restore = (previous: Card[] | undefined) => {
    if (previous) queryClient.setQueryData(key, previous);
  };
  const confirm = (card: Card) =>
    queryClient.setQueryData<Card[]>(key, (cards) =>
      cards?.map((item) =>
        item.$id === card.$id && item.$updatedAt <= card.$updatedAt ? card : item,
      ),
    );

  const update = useMutation({
    mutationFn: ({ cardId, changes }: { cardId: string; changes: CardChanges }) =>
      tablesDB.updateRow<Card>({
        ...table('cards'),
        rowId: cardId,
        data: { ...changes, editedBy: userId, runId: null },
      }),
    onMutate: ({ cardId, changes }) =>
      patchCache((cards) =>
        cards.map((card) =>
          card.$id === cardId ? { ...card, ...changes, editedBy: userId, runId: null } : card,
        ),
      ),
    onError: (err, _vars, previous) => {
      restore(previous);
      saveError(err);
    },
    onSuccess: confirm,
  });

  const create = useMutation({
    mutationFn: ({ rowId, card }: { rowId: string; card: NewCard }) =>
      tablesDB.createRow<Card>({
        ...table('cards'),
        rowId,
        data: {
          boardId,
          title: card.title,
          status: card.status,
          position: card.position,
          description: null,
          priority: 'none',
          label: null,
          assigneeId: null,
          parentId: card.parentId ?? null,
          dueAt: null,
          agentNote: null,
          createdBy: userId,
          editedBy: userId,
          runId: null,
        },
        // Everyone in the workspace team can see, change, and delete the card.
        permissions: [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId)),
        ],
      }),
    onMutate: ({ rowId, card }) =>
      patchCache((cards) => [
        ...cards,
        {
          $id: rowId,
          $sequence: '',
          $tableId: 'cards',
          $databaseId: 'weft',
          $createdAt: new Date().toISOString(),
          // Empty, so the Realtime event for this card always replaces it.
          $updatedAt: '',
          $permissions: [],
          boardId,
          description: null,
          priority: 'none',
          label: null,
          assigneeId: null,
          parentId: card.parentId ?? null,
          dueAt: null,
          agentNote: null,
          createdBy: userId,
          editedBy: userId,
          runId: null,
          ...card,
        },
      ]),
    onError: (err, _vars, previous) => {
      restore(previous);
      saveError(err);
    },
    onSuccess: confirm,
  });

  const remove = useMutation({
    mutationFn: (cardId: string) => tablesDB.deleteRow({ ...table('cards'), rowId: cardId }),
    onMutate: (cardId) => patchCache((cards) => cards.filter((card) => card.$id !== cardId)),
    onError: (err, _cardId, previous) => {
      restore(previous);
      saveError(err);
    },
  });

  return {
    updateCard: (cardId: string, changes: CardChanges) => update.mutate({ cardId, changes }),
    createCard: (card: NewCard) => {
      const rowId = ID.unique();
      create.mutate({ rowId, card });
      return rowId;
    },
    deleteCard: (cardId: string) => remove.mutate(cardId),
  };
}
