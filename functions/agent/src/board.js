import { Permission, Query, Role } from 'node-appwrite';
import { AGENT_ROLE, BOARDS, CARDS } from './config.js';
import { shorten } from './util.js';

export const COLUMNS = { inbox: 'Inbox', next: 'Up next', doing: 'In progress', done: 'Done' };

/** True if the user is a confirmed member of the team. */
export async function isMember(teams, teamId, userId) {
  const { memberships } = await teams.listMemberships({
    teamId,
    queries: [Query.equal('userId', [userId])],
  });
  return memberships.some((membership) => membership.confirm);
}

/** The team's agent is the member with the role `agent`. */
export async function findAgentId(teams, teamId) {
  const { memberships } = await teams.listMemberships({
    teamId,
    queries: [Query.contains('roles', [AGENT_ROLE])],
  });
  return memberships.find((membership) => membership.confirm)?.userId ?? null;
}

/**
 * Any signed-in user can create a card row with any boardId, but only
 * members of a team can give the team read access. The agent reads cards
 * with an API key, which ignores permissions, so it keeps only the cards
 * that the board's team can read.
 */
export function isTeamCard(card, teamId) {
  return card.$permissions.includes(Permission.read(Role.team(teamId)));
}

/** Everything the agent needs to know about the board, loaded once per run. */
export async function loadBoard({ tablesDB, teams, users }, run) {
  const board = await tablesDB.getRow({ ...BOARDS, rowId: run.boardId });

  const { memberships } = await teams.listMemberships({
    teamId: board.teamId,
    queries: [Query.limit(100)],
  });
  const members = memberships.filter((m) => m.confirm);
  const agentId = members.find((m) => m.roles.includes(AGENT_ROLE))?.userId;
  const personIds = members.filter((m) => !m.roles.includes(AGENT_ROLE)).map((m) => m.userId);

  // Job titles live in each person's preferences. They help the agent pick
  // an assignee.
  const { users: profiles } = personIds.length
    ? await users.list({ queries: [Query.equal('$id', personIds), Query.limit(100)] })
    : { users: [] };
  const people = profiles.map((user) => ({
    id: user.$id,
    name: user.name,
    title: user.prefs.title ?? null,
  }));

  const { rows } = await tablesDB.listRows({
    ...CARDS,
    queries: [Query.equal('boardId', [board.$id]), Query.orderAsc('position'), Query.limit(200)],
  });
  const cards = rows.filter((card) => isTeamCard(card, board.teamId));

  return {
    id: board.$id,
    name: board.name,
    description: board.description,
    teamId: board.teamId,
    agentId,
    people,
    cards,
  };
}

/** The card as the model sees it in the context and in tool results. */
export function compactCard(card) {
  return {
    id: card.$id,
    title: card.title,
    status: card.status,
    priority: card.priority,
    label: card.label ?? null,
    assignee: card.assigneeId ?? null,
    due: card.dueAt ? card.dueAt.slice(0, 10) : null,
    parent: card.parentId ?? null,
    description: card.description ? shorten(card.description, 300) : null,
  };
}

/** A card title for activity text and step summaries. */
export function cardLabel(title) {
  return `“${shorten(title, 40)}”`;
}
