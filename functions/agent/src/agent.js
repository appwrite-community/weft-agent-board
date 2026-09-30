import { loadBoard } from './board.js';
import { MAX_TOOL_ERRORS, MAX_TURNS, RUNS } from './config.js';
import {
  TIME_BUDGET_MESSAGE,
  UnreadableOutputError,
  modelFailureMessage,
  streamCompletion,
} from './model.js';
import { createAgentPresence } from './presence.js';
import { SYSTEM_PROMPT, contextMessage } from './prompts.js';
import { createToolbox, toolsFor } from './tools.js';
import { describeError } from './util.js';
import { createRowWriter } from './writer.js';

const CANT_APPLY = "The agent couldn't apply its changes.";

/**
 * Runs one request on the board and returns how it ended:
 * { status: 'done' | 'stopped', reply } or { status: 'failed', error }.
 *
 * Every change is a row write, so people see each step as it happens. The
 * agent's presence tells them which card it works on and what it does.
 */
export async function runAgent({ clients, openai, run, deadline, log }) {
  const board = await loadBoard(clients, run);
  const target = run.cardId ? board.cards.find((card) => card.$id === run.cardId) : null;
  if (run.cardId && !target) return { status: 'failed', error: "This card doesn't exist anymore." };

  const presence = createAgentPresence({
    presences: clients.presences,
    agentId: board.agentId,
    teamId: board.teamId,
    boardId: board.id,
    runId: run.$id,
    log,
  });
  const reply = createRowWriter({
    tablesDB: clients.tablesDB,
    table: RUNS,
    rowId: run.$id,
    column: 'reply',
  });
  const toolbox = createToolbox({ clients, openai, board, run, target, presence, deadline });
  const tools = toolsFor(run.kind);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: contextMessage(board, run, target) },
  ];
  let errorsInARow = 0;

  try {
    await presence.set({ activity: 'Reading the board' });

    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      if (Date.now() >= deadline) return { status: 'failed', error: TIME_BUDGET_MESSAGE };

      const { stoppedBy } = await clients.tablesDB.getRow({ ...RUNS, rowId: run.$id });
      if (stoppedBy) return stopped(board, stoppedBy, toolbox.changes);

      let writing = false;
      let message;
      try {
        message = await streamCompletion({
          openai,
          messages,
          tools,
          deadline,
          onText: (text) => {
            if (!writing) {
              writing = true;
              presence.set({
                cardId: null,
                field: null,
                progress: null,
                activity:
                  run.kind === 'summary' ? 'Writing the standup summary' : 'Writing a reply',
              });
            }
            reply.write(text);
          },
        });
      } catch (err) {
        if (!(err instanceof UnreadableOutputError)) throw err;
        // Ask again. Broken output counts like a failed tool call.
        log(`Unreadable model output: ${err.message}`);
        if (writing) reply.write(null);
        if (++errorsInARow >= MAX_TOOL_ERRORS) return { status: 'failed', error: CANT_APPLY };
        continue;
      }
      messages.push(message);

      if (!message.tool_calls?.length) {
        await reply.close();
        return {
          status: 'done',
          reply: message.content?.trim() || finishedWithoutReply(toolbox.changes),
        };
      }
      // Text that comes with tool calls is the model thinking aloud, not the reply.
      if (writing) reply.write(null);

      for (const call of message.tool_calls) {
        const result = await toolbox.run(call);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
        errorsInARow = result.error ? errorsInARow + 1 : 0;
        if (result.error) log(`Tool ${call.function.name} failed: ${result.error}`);
        if (errorsInARow >= MAX_TOOL_ERRORS) return { status: 'failed', error: CANT_APPLY };
      }
    }

    return { status: 'failed', error: `The agent stopped after ${MAX_TURNS} steps.` };
  } catch (err) {
    const error = modelFailureMessage(err);
    if (!error) throw err;
    log(`Model request failed: ${describeError(err)}`);
    return { status: 'failed', error };
  } finally {
    await reply.close();
    await presence.clear();
  }
}

function stopped(board, userId, changes) {
  const name = board.people.find((person) => person.id === userId)?.name ?? 'a teammate';
  const count = changes === 1 ? '1 change' : `${changes} changes`;
  return {
    status: 'stopped',
    reply:
      changes === 0
        ? `Stopped by ${name} before any changes.`
        : `Stopped by ${name} after ${count}.`,
  };
}

function finishedWithoutReply(changes) {
  return changes === 1 ? 'Done. I made 1 change.' : `Done. I made ${changes} changes.`;
}
