import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ID, ProjectKeyScopes, Query, Role, Runtime } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as tar from 'tar';
import { DATABASE_ID, functions, orNull, project, tablesDB } from './lib/appwrite.ts';
import { waitFor } from './lib/wait.ts';
import { tables, type Column, type Table } from './schema.ts';

const FUNCTION_DIR = fileURLToPath(new URL('../functions/agent', import.meta.url));
const DEFAULT_MODEL = 'openai/gpt-6-luna';

const agentFunction = {
  functionId: 'agent',
  name: 'agent',
  runtime: Runtime.Node22,
  execute: [Role.users()],
  schedule: '*/5 * * * *',
  timeout: 180,
  logging: true,
  entrypoint: 'src/main.js',
  commands: 'npm install',
  scopes: [
    ProjectKeyScopes.RowsRead,
    ProjectKeyScopes.RowsWrite,
    ProjectKeyScopes.PresencesRead,
    ProjectKeyScopes.PresencesWrite,
    ProjectKeyScopes.TeamsRead,
    ProjectKeyScopes.UsersRead,
    ProjectKeyScopes.ExecutionsWrite,
  ],
};

async function provisionDatabase() {
  if (!(await orNull(tablesDB.get({ databaseId: DATABASE_ID })))) {
    await tablesDB.create({ databaseId: DATABASE_ID, name: 'Weft' });
  }
  for (const table of tables) await provisionTable(table);
}

async function provisionTable({ tableId, name, permissions, columns, indexes }: Table) {
  const ref = { databaseId: DATABASE_ID, tableId };
  if (await orNull(tablesDB.getTable(ref))) {
    await tablesDB.updateTable({ ...ref, name, permissions, rowSecurity: true });
  } else {
    await tablesDB.createTable({ ...ref, name, permissions, rowSecurity: true });
  }

  const existingColumns = await tablesDB.listColumns({ ...ref, queries: [Query.limit(100)] });
  const columnKeys = new Set(existingColumns.columns.map((column) => column.key));
  for (const column of columns) {
    if (!columnKeys.has(column.key)) await createColumn(tableId, column);
  }
  await waitFor(
    `the columns of ${tableId}`,
    () => tablesDB.listColumns({ ...ref, queries: [Query.limit(100)] }),
    ({ columns }) => columns.every((column) => column.status === 'available'),
  );

  const existingIndexes = await tablesDB.listIndexes({ ...ref, queries: [Query.limit(100)] });
  const indexKeys = new Set(existingIndexes.indexes.map((index) => index.key));
  for (const index of indexes) {
    if (!indexKeys.has(index.key)) await tablesDB.createIndex({ ...ref, ...index });
  }
  await waitFor(
    `the indexes of ${tableId}`,
    () => tablesDB.listIndexes({ ...ref, queries: [Query.limit(100)] }),
    ({ indexes }) => indexes.every((index) => index.status === 'available'),
  );
  console.log(`Table ${tableId}: ${columns.length} columns, ${indexes.length} indexes`);
}

function createColumn(tableId: string, column: Column) {
  const params = { databaseId: DATABASE_ID, tableId, key: column.key, required: column.required };
  switch (column.type) {
    case 'varchar':
      return tablesDB.createVarcharColumn({ ...params, size: column.size });
    case 'text':
      return tablesDB.createTextColumn(params);
    case 'enum':
      return tablesDB.createEnumColumn({ ...params, elements: column.elements });
    case 'float':
      return tablesDB.createFloatColumn(params);
    case 'datetime':
      return tablesDB.createDatetimeColumn(params);
  }
}

async function provisionFunction() {
  const { functionId } = agentFunction;
  if (await orNull(functions.get({ functionId }))) {
    await functions.update(agentFunction);
  } else {
    await functions.create(agentFunction);
  }

  await setVariable('OPENROUTER_MODEL', process.env.OPENROUTER_MODEL || DEFAULT_MODEL, false);
  if (process.env.OPENROUTER_API_KEY) {
    await setVariable('OPENROUTER_API_KEY', process.env.OPENROUTER_API_KEY, true);
  } else {
    console.log('OPENROUTER_API_KEY is not set: kept the existing function variable.');
  }

  // Variables reach the function with the next deployment, so deploy last.
  const deployment = await deployFunction();
  console.log(`Function agent: deployment ${deployment.$id} is ${deployment.status}`);
}

async function setVariable(key: string, value: string, secret: boolean) {
  const { functionId } = agentFunction;
  const { variables } = await functions.listVariables({
    functionId,
    queries: [Query.equal('key', [key])],
  });
  const existing = variables.find((variable) => variable.key === key);
  if (existing) {
    await functions.updateVariable({ functionId, variableId: existing.$id, key, value, secret });
  } else {
    await functions.createVariable({ functionId, variableId: ID.unique(), key, value, secret });
  }
}

async function deployFunction() {
  const { functionId } = agentFunction;
  const dir = mkdtempSync(join(tmpdir(), 'weft-agent-'));
  const archive = join(dir, 'code.tar.gz');
  try {
    await tar.create(
      {
        gzip: true,
        file: archive,
        cwd: FUNCTION_DIR,
        filter: (path) => !path.includes('node_modules'),
      },
      ['.'],
    );
    const deployment = await functions.createDeployment({
      functionId,
      code: InputFile.fromPath(archive, 'code.tar.gz'),
      activate: true,
    });
    return await waitFor(
      'the function build',
      () => functions.getDeployment({ functionId, deploymentId: deployment.$id }),
      ({ status }) => ['ready', 'failed', 'canceled'].includes(status),
      300_000,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await provisionDatabase();
// New projects hide member details from teammates. Presences and cards refer
// to people by user ID, so the app needs each member's ID and name. Emails
// stay hidden.
await project.updateMembershipPrivacyPolicy({ userId: true, userName: true });
console.log('Membership privacy: IDs and names visible to teammates');
await provisionFunction();
