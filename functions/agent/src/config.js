export const DATABASE_ID = 'weft';
export const BOARDS = { databaseId: DATABASE_ID, tableId: 'boards' };
export const CARDS = { databaseId: DATABASE_ID, tableId: 'cards' };
export const RUNS = { databaseId: DATABASE_ID, tableId: 'runs' };
export const STEPS = { databaseId: DATABASE_ID, tableId: 'steps' };
export const ACTIVE_RUNS = { databaseId: DATABASE_ID, tableId: 'active_runs' };

export const AGENT_FUNCTION_ID = 'agent';
export const AGENT_ROLE = 'agent';

// A run stops on its own after RUN_BUDGET_MS, well before the 180 second
// function timeout. A claim older than STALE_AFTER_MS belongs to an
// execution that no longer runs.
export const RUN_BUDGET_MS = 150_000;
export const STALE_AFTER_MS = 240_000;

export const MAX_TURNS = 24;
export const MAX_TOOL_ERRORS = 3;
export const MAX_NEW_CARDS = 8;
export const MAX_OPEN_RUNS_PER_TEAM = 5;

export const PRESENCE_TTL_MS = 60_000;
export const PRESENCE_HEARTBEAT_MS = 20_000;
export const WRITE_INTERVAL_MS = 100;
