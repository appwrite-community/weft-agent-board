import { Permission, Role, TablesDBIndexType } from 'node-appwrite';

export type Column =
  | { type: 'varchar'; key: string; size: number; required: boolean }
  | { type: 'text'; key: string; required: boolean }
  | { type: 'enum'; key: string; elements: string[]; required: boolean }
  | { type: 'float'; key: string; required: boolean }
  | { type: 'datetime'; key: string; required: boolean };

export type Index = { key: string; type: TablesDBIndexType; columns: string[] };

export type Table = {
  tableId: string;
  name: string;
  permissions: string[];
  columns: Column[];
  indexes: Index[];
};

const id = (key: string, required = false): Column => ({
  type: 'varchar',
  key,
  size: 36,
  required,
});

// Every table uses row security. People can create cards; everything else is
// written by the seed script or the agent function with an API key.
export const tables: Table[] = [
  {
    tableId: 'boards',
    name: 'Boards',
    permissions: [],
    columns: [
      id('teamId', true),
      { type: 'varchar', key: 'name', size: 80, required: true },
      { type: 'varchar', key: 'description', size: 280, required: false },
    ],
    indexes: [{ key: 'team', type: TablesDBIndexType.Key, columns: ['teamId'] }],
  },
  {
    tableId: 'cards',
    name: 'Cards',
    permissions: [Permission.create(Role.users())],
    columns: [
      id('boardId', true),
      { type: 'varchar', key: 'title', size: 160, required: true },
      { type: 'text', key: 'description', required: false },
      { type: 'enum', key: 'status', elements: ['inbox', 'next', 'doing', 'done'], required: true },
      { type: 'float', key: 'position', required: true },
      {
        type: 'enum',
        key: 'priority',
        elements: ['urgent', 'high', 'medium', 'low', 'none'],
        required: true,
      },
      {
        type: 'enum',
        key: 'label',
        elements: ['bug', 'feature', 'design', 'ops', 'qa'],
        required: false,
      },
      id('assigneeId'),
      id('parentId'),
      { type: 'datetime', key: 'dueAt', required: false },
      { type: 'varchar', key: 'agentNote', size: 280, required: false },
      id('createdBy', true),
      id('editedBy'),
      id('runId'),
    ],
    indexes: [
      { key: 'board_position', type: TablesDBIndexType.Key, columns: ['boardId', 'position'] },
      {
        key: 'board_column',
        type: TablesDBIndexType.Key,
        columns: ['boardId', 'status', 'position'],
      },
      { key: 'parent', type: TablesDBIndexType.Key, columns: ['parentId'] },
    ],
  },
  {
    tableId: 'runs',
    name: 'Runs',
    permissions: [],
    columns: [
      id('boardId', true),
      id('teamId', true),
      {
        type: 'enum',
        key: 'kind',
        elements: ['triage', 'split', 'draft', 'summary', 'ask'],
        required: true,
      },
      id('cardId'),
      { type: 'varchar', key: 'prompt', size: 1000, required: false },
      id('requestedBy', true),
      {
        type: 'enum',
        key: 'status',
        elements: ['queued', 'running', 'done', 'failed', 'stopped'],
        required: true,
      },
      { type: 'datetime', key: 'startedAt', required: false },
      { type: 'datetime', key: 'finishedAt', required: false },
      { type: 'text', key: 'reply', required: false },
      { type: 'varchar', key: 'error', size: 500, required: false },
      id('stoppedBy'),
    ],
    indexes: [
      {
        key: 'team_queue',
        type: TablesDBIndexType.Key,
        columns: ['teamId', 'status', '$createdAt'],
      },
      { key: 'board_runs', type: TablesDBIndexType.Key, columns: ['boardId', '$createdAt'] },
    ],
  },
  {
    tableId: 'steps',
    name: 'Steps',
    permissions: [],
    columns: [
      id('runId', true),
      id('boardId', true),
      id('cardId'),
      {
        type: 'enum',
        key: 'kind',
        elements: ['update', 'create', 'write', 'skip'],
        required: true,
      },
      { type: 'varchar', key: 'summary', size: 300, required: true },
    ],
    indexes: [
      { key: 'run', type: TablesDBIndexType.Key, columns: ['runId', '$createdAt'] },
      { key: 'board_steps', type: TablesDBIndexType.Key, columns: ['boardId', '$createdAt'] },
    ],
  },
  {
    // A row here means the agent is working on the run with the same ID.
    // The unique index allows one active run per team.
    tableId: 'active_runs',
    name: 'Active runs',
    permissions: [],
    columns: [id('teamId', true)],
    indexes: [{ key: 'one_per_team', type: TablesDBIndexType.Unique, columns: ['teamId'] }],
  },
];
