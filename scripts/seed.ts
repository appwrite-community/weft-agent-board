import { Permission, Query, Role } from 'node-appwrite';
import { agent, boards, cards, people, team, type SeedCard } from './data/fernway.ts';
import { DATABASE_ID, orNull, presences, tablesDB, teams, users } from './lib/appwrite.ts';
import { requireEnv } from './lib/env.ts';

// `pnpm run seed` adds what is missing. `pnpm run reset` also restores every
// seed card and removes the agent's cards, runs, and steps.
const reset = process.argv.includes('--reset');
const password = requireEnv('DEMO_PASSWORD');

const table = (tableId: string) => ({ databaseId: DATABASE_ID, tableId });
const teamPermissions = [
  Permission.read(Role.team(team.id)),
  Permission.update(Role.team(team.id)),
  Permission.delete(Role.team(team.id)),
];

async function seedPeople() {
  for (const person of people) {
    if (!(await orNull(users.get({ userId: person.id })))) {
      await users.create({ userId: person.id, email: person.email, password, name: person.name });
    }
    await users.updatePrefs({ userId: person.id, prefs: { title: person.title } });
  }
  console.log(`People: ${people.map((person) => person.name).join(', ')}`);
}

async function seedTeam() {
  if (!(await orNull(teams.get({ teamId: team.id })))) {
    await teams.create({ teamId: team.id, name: team.name });
  }
  const { memberships } = await teams.listMemberships({
    teamId: team.id,
    queries: [Query.limit(100)],
  });
  const members = new Set(memberships.map((membership) => membership.userId));
  for (const person of people) {
    if (!members.has(person.id)) {
      await teams.createMembership({ teamId: team.id, userId: person.id, roles: [person.role] });
    }
  }

  // The agent is a user without an email or a password, so nobody can sign
  // in as the agent. The role `agent` tells the app and the function which
  // member is the team's agent.
  if (!(await orNull(users.get({ userId: agent.id })))) {
    await users.create({ userId: agent.id, name: agent.name });
  }
  if (!members.has(agent.id)) {
    await teams.createMembership({ teamId: team.id, userId: agent.id, roles: ['agent'] });
  }
  console.log(`Team ${team.name}: ${people.length} people and ${agent.name}`);
}

async function seedBoards() {
  for (const board of boards) {
    await tablesDB.upsertRow({
      ...table('boards'),
      rowId: board.id,
      data: { teamId: team.id, name: board.name, description: board.description },
      permissions: [Permission.read(Role.team(team.id))],
    });
  }

  const positions = new Map<string, number>();
  for (const card of cards) {
    const column = `${card.boardId}/${card.status}`;
    const position = (positions.get(column) ?? 0) + 1000;
    positions.set(column, position);
    if (reset || !(await orNull(tablesDB.getRow({ ...table('cards'), rowId: card.id })))) {
      await tablesDB.upsertRow({
        ...table('cards'),
        rowId: card.id,
        data: cardData(card, position),
        permissions: teamPermissions,
      });
    }
  }
  console.log(`Boards: ${boards.map((board) => board.name).join(', ')} (${cards.length} cards)`);
}

function cardData(card: SeedCard, position: number) {
  return {
    boardId: card.boardId,
    title: card.title,
    description: card.description ?? null,
    status: card.status,
    position,
    priority: card.priority ?? 'none',
    label: card.label ?? null,
    assigneeId: card.assigneeId ?? null,
    parentId: null,
    dueAt: card.dueAt ?? null,
    agentNote: null,
    createdBy: card.createdBy,
    editedBy: card.createdBy,
    runId: null,
    $createdAt: card.createdAt,
  };
}

async function clearAgentWork() {
  const boardIds = boards.map((board) => board.id);
  const seedIds = new Set(cards.map((card) => card.id));
  const { rows } = await tablesDB.listRows({
    ...table('cards'),
    queries: [Query.equal('boardId', boardIds), Query.limit(500)],
  });
  const extra = rows.filter((card) => !seedIds.has(card.$id));
  for (const card of extra) await tablesDB.deleteRow({ ...table('cards'), rowId: card.$id });

  await tablesDB.deleteRows({
    ...table('active_runs'),
    queries: [Query.equal('teamId', [team.id])],
  });
  await tablesDB.deleteRows({ ...table('runs'), queries: [Query.equal('teamId', [team.id])] });
  await tablesDB.deleteRows({ ...table('steps'), queries: [Query.equal('boardId', boardIds)] });
  await orNull(presences.delete({ presenceId: agent.id }));
  console.log(`Reset: removed ${extra.length} cards, all runs and steps, and the agent's presence`);
}

await seedPeople();
await seedTeam();
if (reset) await clearAgentWork();
await seedBoards();
