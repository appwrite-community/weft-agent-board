import { WRITE_INTERVAL_MS } from './config.js';

/**
 * Streams text into one column of a row. The model produces text faster
 * than people can read it, so the writer sends at most one update every
 * WRITE_INTERVAL_MS, always with the latest text, and never runs two
 * updates at the same time. Every update reaches the board through Realtime.
 */
export function createRowWriter({ tablesDB, table, rowId, column }) {
  let latest = null;
  let saved = null;
  let lastWriteAt = 0;
  let timer = null;
  let closed = false;
  let queue = Promise.resolve();

  const save = () => {
    timer = null;
    queue = queue.then(async () => {
      if (latest === saved) return;
      const text = latest;
      lastWriteAt = Date.now();
      try {
        await tablesDB.updateRow({ ...table, rowId, data: { [column]: text } });
        saved = text;
      } catch {
        // A later update or the final flush sends the latest text again.
      }
    });
  };

  /** Stops the timer and waits for the update in progress. */
  const close = async () => {
    closed = true;
    clearTimeout(timer);
    await queue;
  };

  return {
    /** Replaces the text. The row catches up within WRITE_INTERVAL_MS. */
    write(text) {
      latest = text;
      if (closed || timer) return;
      timer = setTimeout(save, Math.max(0, lastWriteAt + WRITE_INTERVAL_MS - Date.now()));
    },

    /** Writes the final text, with any other columns in `data`, and waits for it. */
    async flush(text, data = {}) {
      await close();
      return tablesDB.updateRow({ ...table, rowId, data: { [column]: text, ...data } });
    },

    close,
  };
}
