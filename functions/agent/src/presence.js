import { Permission, Role } from 'node-appwrite';
import { PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS } from './config.js';
import { describeError } from './util.js';

/**
 * The agent's presence on the board. Appwrite keeps one presence per user,
 * and the agent is a user of its own, so it appears next to the people.
 *
 * Server SDKs have no Realtime socket, so the presence expires unless the
 * agent renews it: every change renews it, and a heartbeat renews it while
 * the model thinks. If the function stops, the presence expires within
 * PRESENCE_TTL_MS.
 *
 * The presence shows the work but does not do it, so a failed update is
 * logged and the run continues.
 */
export function createAgentPresence({ presences, agentId, teamId, boardId, runId, log }) {
  let metadata = { boardId, runId, cardId: null, field: null, activity: null, progress: null };
  let heartbeat = null;
  // Updates run one after another, so an older update never lands last.
  let queue = Promise.resolve();

  const enqueue = (request) => {
    queue = queue
      .then(request)
      .catch((err) => log(`Presence update failed: ${describeError(err)}`));
    return queue;
  };

  const upsert = () => {
    const snapshot = metadata;
    return enqueue(() =>
      presences.upsert({
        presenceId: agentId,
        userId: agentId,
        status: 'working',
        metadata: snapshot,
        expiresAt: new Date(Date.now() + PRESENCE_TTL_MS).toISOString(),
        // Only the team can see the agent at work.
        permissions: [Permission.read(Role.team(teamId))],
      }),
    );
  };

  return {
    /** Shows what the agent does now, for example { cardId, activity: 'Triaging 3 of 6 cards' }. */
    set(patch) {
      metadata = { ...metadata, ...patch };
      clearInterval(heartbeat);
      heartbeat = setInterval(upsert, PRESENCE_HEARTBEAT_MS);
      return upsert();
    },

    /** Removes the presence, which notifies everyone on the board. */
    clear() {
      clearInterval(heartbeat);
      return enqueue(async () => {
        try {
          await presences.delete({ presenceId: agentId });
        } catch (err) {
          if (err.code !== 404) throw err;
        }
      });
    },
  };
}
