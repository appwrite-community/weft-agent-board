import { ExecutionMethod, ID, type Models } from 'appwrite';
import { AGENT_FUNCTION_ID, functions } from './appwrite';
import type { RunKind } from './types';

export type RunRequest = {
  boardId: string;
  kind: RunKind;
  cardId?: string;
  prompt?: string;
};

/** The function answered with an error status; the message is written for people. */
export class AgentRequestError extends Error {}

/**
 * Asks the agent for something. The function checks the request, queues it
 * as a run, and answers right away; the agent's work then arrives through
 * Realtime. The request ID makes a retried request safe: the function finds
 * the run it already created instead of queuing the work twice.
 */
export async function requestRun(request: RunRequest) {
  const execution = await functions.createExecution({
    functionId: AGENT_FUNCTION_ID,
    xpath: '/runs',
    method: ExecutionMethod.POST,
    body: JSON.stringify({ requestId: ID.unique(), ...request }),
  });
  return readResponse<{ runId: string }>(execution);
}

/** Stops a running request after its current step, or cancels a queued one. */
export async function stopRun(runId: string) {
  const execution = await functions.createExecution({
    functionId: AGENT_FUNCTION_ID,
    xpath: '/runs/stop',
    method: ExecutionMethod.POST,
    body: JSON.stringify({ runId }),
  });
  return readResponse<{ runId: string }>(execution);
}

function readResponse<T>(execution: Models.Execution): T {
  const body = parseJson<T & { message?: string }>(execution.responseBody);
  const ok = execution.responseStatusCode >= 200 && execution.responseStatusCode < 300;
  if (!ok || !body) {
    throw new AgentRequestError(body?.message ?? "The agent didn't answer. Try again.");
  }
  return body;
}

function parseJson<T>(text: string): T | null {
  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}
