import { ExecutionMethod, Permission, Query, Role } from 'node-appwrite';
import { runAgent } from './agent.js';
import { findAgentId, isMember, isTeamCard } from './board.js';
import {
  ACTIVE_RUNS,
  AGENT_FUNCTION_ID,
  BOARDS,
  CARDS,
  MAX_OPEN_RUNS_PER_TEAM,
  RUNS,
  STALE_AFTER_MS,
} from './config.js';
import { describeError, isId, now, orNull } from './util.js';

const KINDS = ['triage', 'split', 'draft', 'summary', 'ask'];
const CARD_KINDS = ['split', 'draft'];
const FINISHED = ['done', 'failed', 'stopped'];

const respond = (status, body) => ({ status, body });
const reject = (status, message) => respond(status, { message });

/**
 * POST /runs: a person asks the agent for something. Appwrite sets
 * x-appwrite-user-id for executions from a signed-in user, so the function
 * knows who asked. The request becomes a queued row, then a drain runs it.
 */
export async function enqueue({ tablesDB, teams, functions }, userId, body, log) {
  if (!userId) return reject(401, 'Sign in to ask the agent.');
  const request = parseRequest(body);
  if (request.error) return reject(400, request.error);

  const board = await orNull(tablesDB.getRow({ ...BOARDS, rowId: request.boardId }));
  if (!board) return reject(404, "This board doesn't exist.");
  if (!(await isMember(teams, board.teamId, userId))) {
    return reject(403, "You aren't a member of this workspace.");
  }
  if (!(await findAgentId(teams, board.teamId))) {
    return reject(409, 'This workspace has no agent yet.');
  }

  if (request.cardId) {
    const card = await orNull(tablesDB.getRow({ ...CARDS, rowId: request.cardId }));
    if (!card || card.boardId !== board.$id || !isTeamCard(card, board.teamId)) {
      return reject(404, "This card doesn't exist.");
    }
  }

  const open = await tablesDB.listRows({
    ...RUNS,
    queries: [
      Query.equal('teamId', [board.teamId]),
      Query.equal('status', ['queued', 'running']),
      Query.limit(1),
    ],
  });
  if (open.total >= MAX_OPEN_RUNS_PER_TEAM) {
    return reject(
      429,
      `The agent already has ${MAX_OPEN_RUNS_PER_TEAM} requests. Try again when one finishes.`,
    );
  }

  // The app creates the request ID, so a retried request finds the row it
  // created the first time instead of queuing the work twice.
  try {
    await tablesDB.createRow({
      ...RUNS,
      rowId: request.requestId,
      data: {
        boardId: board.$id,
        teamId: board.teamId,
        kind: request.kind,
        cardId: request.cardId,
        prompt: request.prompt,
        requestedBy: userId,
        status: 'queued',
      },
      permissions: [Permission.read(Role.team(board.teamId))],
    });
  } catch (err) {
    if (err.type !== 'row_already_exists') throw err;
    const existing = await tablesDB.getRow({ ...RUNS, rowId: request.requestId });
    if (existing.requestedBy !== userId) return reject(409, 'This request ID is already in use.');
  }

  await kick(functions, board.teamId, log);
  return respond(202, { runId: request.requestId });
}

function parseRequest(body) {
  const { requestId, boardId, kind, cardId, prompt } = body ?? {};
  if (!isId(requestId)) return { error: 'Send a request ID created with ID.unique().' };
  if (!isId(boardId)) return { error: 'Choose a board.' };
  if (!KINDS.includes(kind)) return { error: `Choose one of these requests: ${KINDS.join(', ')}.` };
  if (CARD_KINDS.includes(kind) && !isId(cardId)) return { error: 'Choose a card.' };
  if (kind === 'ask' && (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 1000)) {
    return { error: 'Write a request of 1 to 1000 characters.' };
  }
  return {
    requestId,
    boardId,
    kind,
    cardId: CARD_KINDS.includes(kind) ? cardId : null,
    prompt: kind === 'ask' ? prompt.trim() : null,
  };
}

/**
 * POST /runs/stop: any member of the team can stop a request. The function
 * only marks the run; the execution that runs it stops before its next
 * step, and a queued run never starts.
 */
export async function stopRun({ tablesDB, teams }, userId, body) {
  if (!userId) return reject(401, 'Sign in to stop a request.');
  if (!isId(body?.runId)) return reject(400, 'Choose a request to stop.');

  const run = await orNull(tablesDB.getRow({ ...RUNS, rowId: body.runId }));
  if (!run) return reject(404, "This request doesn't exist.");
  if (!(await isMember(teams, run.teamId, userId))) {
    return reject(403, "You aren't a member of this workspace.");
  }
  if (FINISHED.includes(run.status)) return reject(409, 'This request already finished.');

  await tablesDB.updateRow({ ...RUNS, rowId: run.$id, data: { stoppedBy: userId } });
  return respond(200, { runId: run.$id });
}

/** Starts an asynchronous execution of this function that drains the team's queue. */
export async function kick(functions, teamId, log) {
  try {
    await functions.createExecution({
      functionId: AGENT_FUNCTION_ID,
      async: true,
      xpath: '/drain',
      method: ExecutionMethod.POST,
      body: JSON.stringify({ teamId }),
    });
  } catch (err) {
    // The run stays queued. The scheduled recovery starts a drain later.
    log(`Could not start a drain for ${teamId}: ${describeError(err)}`);
  }
}

/**
 * POST /drain: runs the oldest queued request of a team, if the team has no
 * active run. Each execution runs one request, then starts a new execution
 * for the next one, so every run gets the full time budget.
 */
export async function drain(clients, teamId, { deadline, log }) {
  const { tablesDB, users, functions } = clients;
  await recover(clients, { teamId, log });

  for (;;) {
    const next = await oldestQueuedRun(tablesDB, teamId);
    if (!next) return;

    if (!(await claim(tablesDB, next))) {
      // Another execution works on this team. It starts the next drain when it finishes.
      return;
    }

    const run = await orNull(tablesDB.getRow({ ...RUNS, rowId: next.$id }));
    if (run?.status !== 'queued') {
      // Another execution finished this run after this drain listed it.
      await release(tablesDB, next.$id);
      continue;
    }
    if (run.stoppedBy) {
      const person = await orNull(users.get({ userId: run.stoppedBy }));
      await finish(tablesDB, run, {
        status: 'stopped',
        reply: `Canceled by ${person?.name ?? 'a teammate'} before it started.`,
      });
      continue;
    }

    await execute(clients, run, { deadline, log });
    if (await oldestQueuedRun(tablesDB, teamId)) await kick(functions, teamId, log);
    return;
  }
}

function oldestQueuedRun(tablesDB, teamId) {
  return tablesDB
    .listRows({
      ...RUNS,
      queries: [
        Query.equal('teamId', [teamId]),
        Query.equal('status', ['queued']),
        Query.orderAsc('$createdAt'),
        Query.limit(1),
      ],
    })
    .then(({ rows }) => rows[0] ?? null);
}

/**
 * Claims a run with one createRow call. The row ID is the run ID, so two
 * executions can't claim the same run, and the unique index on teamId allows
 * one active run per team. Appwrite rejects either conflict with a 409 error.
 */
async function claim(tablesDB, run) {
  try {
    await tablesDB.createRow({ ...ACTIVE_RUNS, rowId: run.$id, data: { teamId: run.teamId } });
    return true;
  } catch (err) {
    if (err.code === 409) return false;
    throw err;
  }
}

async function release(tablesDB, runId) {
  await orNull(tablesDB.deleteRow({ ...ACTIVE_RUNS, rowId: runId }));
}

/**
 * Writes how the run ended in one update, then releases the team. If the
 * update fails, the claim stays, and recovery marks the run as failed later.
 */
async function finish(tablesDB, run, { status, reply = null, error = null }) {
  await orNull(
    tablesDB.updateRow({
      ...RUNS,
      rowId: run.$id,
      data: { status, reply, error, finishedAt: now() },
    }),
  );
  await release(tablesDB, run.$id);
}

async function execute(clients, run, { deadline, log }) {
  const startedAt = Date.now();
  log(`Run ${run.$id} (${run.kind}) started`);

  let outcome = {
    status: 'failed',
    error: 'Something went wrong while the agent worked on this request.',
  };
  try {
    await clients.tablesDB.updateRow({
      ...RUNS,
      rowId: run.$id,
      data: { status: 'running', startedAt: now() },
    });
    outcome = await runAgent({ clients, openai: clients.openai, run, deadline, log });
  } catch (err) {
    log(`Run ${run.$id} failed: ${describeError(err)}`);
  } finally {
    await finish(clients.tablesDB, run, outcome);
    log(`Run ${run.$id} ${outcome.status} after ${((Date.now() - startedAt) / 1000).toFixed(1)} s`);
  }
}

/**
 * Finds claims older than STALE_AFTER_MS. A run stops itself after
 * RUN_BUDGET_MS, so an older claim belongs to an execution that crashed.
 * Recovery removes the agent's presence, marks the run as failed, and
 * releases the team.
 *
 * Every drain recovers its own team first. The schedule recovers every team
 * and starts a drain for each team with queued runs.
 */
export async function recover(
  { tablesDB, teams, presences, functions },
  { teamId, kickQueued = false, log },
) {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { rows: stale } = await tablesDB.listRows({
    ...ACTIVE_RUNS,
    queries: [
      Query.lessThan('$createdAt', cutoff),
      ...(teamId ? [Query.equal('teamId', [teamId])] : []),
      Query.limit(100),
    ],
  });

  for (const active of stale) {
    // Remove the presence before releasing the team, so it can't remove
    // the presence of the team's next run.
    const agentId = await findAgentId(teams, active.teamId);
    if (agentId) await orNull(presences.delete({ presenceId: agentId }));

    const run = await orNull(tablesDB.getRow({ ...RUNS, rowId: active.$id }));
    if (run && !FINISHED.includes(run.status)) {
      await finish(tablesDB, run, { status: 'failed', error: 'The agent stopped responding.' });
    } else {
      await release(tablesDB, active.$id);
    }
    log(`Recovered run ${active.$id} of ${active.teamId}`);
  }

  if (kickQueued) {
    const { rows: queued } = await tablesDB.listRows({
      ...RUNS,
      queries: [Query.equal('status', ['queued']), Query.select(['teamId']), Query.limit(100)],
    });
    for (const id of new Set(queued.map((run) => run.teamId))) await kick(functions, id, log);
  }
}
