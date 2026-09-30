import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { AgentDock, AgentDrawer } from '@/components/agent/agent-dock';
import { ConnectionBanner } from '@/components/shell/connection-banner';
import { TopBar } from '@/components/shell/top-bar';
import { useBoardRealtime } from '@/hooks/use-board';
import { useCardActions } from '@/hooks/use-card-actions';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useNow } from '@/hooks/use-now';
import { announcePresence, useLivePresences } from '@/hooks/use-presence';
import { setConnectionState, useConnectionState } from '@/lib/connection';
import {
  accountQuery,
  cardsQuery,
  membersQuery,
  presencesQuery,
  runsQuery,
  stepsQuery,
} from '@/lib/queries';
import type { Board, CardStatus, EditableField } from '@/lib/types';
import { BoardColumns } from './board-columns';
import { BoardContext, type BoardState } from './board-context';
import { BoardHeader } from './board-header';
import { CardDialog } from './card-dialog';

const DOCK_KEY = 'weft:dock-open';

export function BoardView({ board }: { board: Board }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { card: openCardId } = useSearch({ from: '/_app/boards/$boardId' });
  const me = useQuery(accountQuery).data!;
  const { data: members = [] } = useQuery(membersQuery(board.teamId));
  const { data: cards = [] } = useQuery(cardsQuery(board.$id));
  const { data: runs = [] } = useQuery(runsQuery(board.$id));
  const { data: steps = [] } = useQuery(stepsQuery(board.$id));
  const livePresences = useLivePresences();
  const now = useNow();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const actions = useCardActions({ boardId: board.$id, teamId: board.teamId, userId: me.$id });

  const [field, setField] = useState<EditableField | null>(null);
  const [search, setSearch] = useState('');
  const [composerColumn, setComposerColumn] = useState<CardStatus | null>(null);
  const [dockPreference, setDockPreference] = useState(
    () => localStorage.getItem(DOCK_KEY) !== 'false',
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusedRunId, setFocusedRunId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useBoardRealtime(board.$id);

  // Tell the team where this person is: the board, the open card, and the field they edit.
  const cardId = openCardId ?? null;
  const editing = cardId ? field : null;
  useEffect(() => {
    announcePresence({
      userId: me.$id,
      teamId: board.teamId,
      status: editing ? 'editing' : 'viewing',
      metadata: { boardId: board.$id, cardId, field: editing },
    });
  }, [me.$id, board.teamId, board.$id, cardId, editing]);

  // After a reconnect, refetch what Realtime could not deliver while offline.
  const connection = useConnectionState();
  useEffect(() => {
    if (connection !== 'syncing') return;
    Promise.all([
      queryClient.fetchQuery({ ...cardsQuery(board.$id), staleTime: 0 }),
      queryClient.fetchQuery({ ...runsQuery(board.$id), staleTime: 0 }),
      queryClient.fetchQuery({ ...stepsQuery(board.$id), staleTime: 0 }),
      queryClient.fetchQuery({ ...presencesQuery, staleTime: 0 }),
    ])
      .catch(() => undefined)
      .finally(() => setConnectionState('live'));
  }, [connection, queryClient, board.$id]);

  const dockOpen = isMobile ? drawerOpen : dockPreference;
  const setDockOpen = (open: boolean) => {
    if (isMobile) return setDrawerOpen(open);
    localStorage.setItem(DOCK_KEY, String(open));
    setDockPreference(open);
  };

  useHotkeys({
    '/': () => searchRef.current?.focus(),
    n: () => setComposerColumn('inbox'),
    a: () => setDockOpen(!dockOpen),
  });

  const memberById = new Map(members.map((member) => [member.userId, member]));
  const teamPresences = livePresences.filter((presence) => memberById.has(presence.userId));
  const state: BoardState = {
    board,
    me,
    members,
    memberById,
    agent: members.find((member) => member.isAgent),
    cards,
    runs,
    steps,
    teamPresences,
    presences: teamPresences.filter((presence) => presence.metadata?.boardId === board.$id),
    agentPresence: teamPresences.find((presence) => memberById.get(presence.userId)?.isAgent),
    now,
    actions,
    openCard: (id) =>
      navigate({ to: '/boards/$boardId', params: { boardId: board.$id }, search: { card: id } }),
    focusField: setField,
    dockOpen,
    setDockOpen,
    focusedRunId,
    showRun: (runId) => {
      setFocusedRunId(runId);
      setDockOpen(true);
    },
  };

  const closeCard = () => {
    setField(null);
    navigate({ to: '/boards/$boardId', params: { boardId: board.$id }, search: {} });
  };

  return (
    <BoardContext.Provider value={state}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <TopBar search={search} onSearchChange={setSearch} searchRef={searchRef} />
        <ConnectionBanner />
        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">
            <BoardHeader />
            <BoardColumns
              search={search}
              composerColumn={composerColumn}
              onComposerColumnChange={setComposerColumn}
            />
          </main>
          {!isMobile && dockPreference && <AgentDock />}
        </div>
        {isMobile && <AgentDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />}
        <CardDialog cardId={cardId} onClose={closeCard} />
      </div>
    </BoardContext.Provider>
  );
}
