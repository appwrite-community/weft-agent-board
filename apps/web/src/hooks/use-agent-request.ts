import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useBoard } from '@/components/board/board-context';
import { AgentRequestError, requestRun, type RunRequest } from '@/lib/agent';
import { table, tablesDB } from '@/lib/appwrite';
import { runsQuery } from '@/lib/queries';
import type { Run } from '@/lib/types';

/** Sends a request to the agent and shows the function's message if it refuses. */
export function useAgentRequest({ onSent }: { onSent?: (request: RunRequest) => void } = {}) {
  const { board, setDockOpen } = useBoard();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: RunRequest) => requestRun(request),
    onSuccess: async ({ runId }, request) => {
      onSent?.(request);
      setDockOpen(true);
      // Realtime usually delivers the new run before the function answers.
      const key = runsQuery(board.$id).queryKey;
      if (queryClient.getQueryData<Run[]>(key)?.some((run) => run.$id === runId)) return;
      const run = await tablesDB.getRow<Run>({ ...table('runs'), rowId: runId });
      queryClient.setQueryData<Run[]>(key, (runs = []) =>
        runs.some((item) => item.$id === run.$id) ? runs : [run, ...runs],
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof AgentRequestError ? err.message : "Couldn't reach the agent. Try again.",
      );
    },
  });

  return { request: mutation.mutate, busy: mutation.isPending };
}
