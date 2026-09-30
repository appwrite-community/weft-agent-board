import { createClients, createModel } from './clients.js';
import { RUN_BUDGET_MS } from './config.js';
import { drain, enqueue, recover, stopRun } from './runs.js';
import { describeError, isId } from './util.js';

export default async ({ req, res, log, error }) => {
  const startedAt = Date.now();
  const clients = createClients(req.headers['x-appwrite-key']);
  // Set by Appwrite when a signed-in user runs the function; empty for
  // executions made with an API key, including this function's own drains.
  const userId = req.headers['x-appwrite-user-id'] || null;

  try {
    if (req.headers['x-appwrite-trigger'] === 'schedule') {
      await recover(clients, { kickQueued: true, log });
      return res.empty();
    }

    const body = parseBody(req);
    const route = `${req.method} ${req.path}`;

    if (route === 'POST /runs') {
      const { status, body: response } = await enqueue(clients, userId, body, log);
      return res.json(response, status);
    }
    if (route === 'POST /runs/stop') {
      const { status, body: response } = await stopRun(clients, userId, body);
      return res.json(response, status);
    }
    if (route === 'POST /drain' && !userId && isId(body?.teamId)) {
      await drain({ ...clients, openai: createModel() }, body.teamId, {
        deadline: startedAt + RUN_BUDGET_MS,
        log,
      });
      return res.empty();
    }
    return res.json({ message: 'Not found.' }, 404);
  } catch (err) {
    error(`${req.method} ${req.path} failed: ${describeError(err)}`);
    return res.json({ message: 'Something went wrong. Try again.' }, 500);
  }
};

function parseBody(req) {
  try {
    return req.bodyJson;
  } catch {
    return null;
  }
}
