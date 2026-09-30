import { ID, Permission, Query, Role } from 'node-appwrite';
import { COLUMNS, cardLabel, compactCard, isTeamCard } from './board.js';
import { CARDS, MAX_NEW_CARDS, STEPS } from './config.js';
import { UnreadableOutputError, streamCompletion } from './model.js';
import { DESCRIPTION_PROMPT, descriptionMessage } from './prompts.js';
import { isId, orNull, shorten } from './util.js';
import { createRowWriter } from './writer.js';

const STATUSES = ['inbox', 'next', 'doing', 'done'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'];
const LABELS = ['bug', 'feature', 'design', 'ops', 'qa'];

const PRIORITY_NAMES = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
};
const LABEL_NAMES = { bug: 'Bug', feature: 'Feature', design: 'Design', ops: 'Ops', qa: 'QA' };

const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });

/** A strict function tool: every property is required, null means "not set". */
const tool = (name, description, properties) => ({
  type: 'function',
  function: {
    name,
    description,
    strict: true,
    parameters: {
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
  },
});

const TOOLS = {
  update_card: tool('update_card', 'Change one card. Pass null for every field you keep.', {
    cardId: { type: 'string' },
    status: nullable({ type: 'string', enum: STATUSES }),
    priority: nullable({ type: 'string', enum: PRIORITIES }),
    label: nullable({ type: 'string', enum: LABELS }),
    assigneeId: nullable({ type: 'string', description: 'The ID of a member you can assign.' }),
    note: nullable({
      type: 'string',
      description: 'One sentence that explains the change to the team.',
    }),
  }),
  create_card: tool('create_card', 'Create one card.', {
    title: { type: 'string' },
    status: { type: 'string', enum: STATUSES },
    priority: { type: 'string', enum: PRIORITIES },
    label: nullable({ type: 'string', enum: LABELS }),
    assigneeId: nullable({ type: 'string', description: 'The ID of a member you can assign.' }),
    parentCardId: nullable({
      type: 'string',
      description: 'The ID of the card this card is a subtask of.',
    }),
    note: nullable({
      type: 'string',
      description: 'One sentence that explains the card to the team.',
    }),
  }),
  write_description: tool(
    'write_description',
    'Write the description of one card. The text is streamed into the card.',
    {
      cardId: { type: 'string' },
      brief: { type: 'string', description: 'What the description must cover.' },
    },
  ),
};

// Each kind of request gets only the tools it needs. No tool deletes cards.
const TOOLS_BY_KIND = {
  triage: ['update_card'],
  split: ['create_card'],
  draft: ['write_description'],
  summary: [],
  ask: ['update_card', 'create_card', 'write_description'],
};

export function toolsFor(kind) {
  return TOOLS_BY_KIND[kind].map((name) => TOOLS[name]);
}

/** A problem with a tool call. The message goes back to the model. */
class ToolError extends Error {}

function check(condition, message) {
  if (!condition) throw new ToolError(message);
}

/**
 * Runs the model's tool calls. The function, not the model, enforces every
 * rule: the card must be on the run's board, assignees must be people on
 * the team, and each request kind can touch only its own card.
 */
export function createToolbox({ clients, openai, board, run, target, presence, deadline }) {
  const { tablesDB, presences } = clients;
  const allowed = new Set(TOOLS_BY_KIND[run.kind]);
  const inbox = new Set(
    board.cards.filter((card) => card.status === 'inbox').map((card) => card.$id),
  );
  const triaged = new Set();
  const teamPermissions = [
    Permission.read(Role.team(board.teamId)),
    Permission.update(Role.team(board.teamId)),
    Permission.delete(Role.team(board.teamId)),
  ];
  let created = 0;
  let changes = 0;

  const personName = (userId) => board.people.find((person) => person.id === userId)?.name;

  async function boardCard(cardId) {
    const card = isId(cardId) ? await orNull(tablesDB.getRow({ ...CARDS, rowId: cardId })) : null;
    check(
      card && card.boardId === board.id && isTeamCard(card, board.teamId),
      `There is no card with the ID ${cardId} on this board.`,
    );
    return card;
  }

  function checkFields({ status, priority, label, assigneeId }) {
    check(status === null || STATUSES.includes(status), `Unknown status ${status}.`);
    check(priority === null || PRIORITIES.includes(priority), `Unknown priority ${priority}.`);
    check(label === null || LABELS.includes(label), `Unknown label ${label}.`);
    check(
      assigneeId === null || personName(assigneeId),
      `${assigneeId} is not a person on this team. Use an ID from the members list.`,
    );
  }

  /** New cards go to the bottom of a column; moved cards go to the top. */
  async function position(status, edge) {
    const { rows } = await tablesDB.listRows({
      ...CARDS,
      queries: [
        Query.equal('boardId', [board.id]),
        Query.equal('status', [status]),
        edge === 'top' ? Query.orderAsc('position') : Query.orderDesc('position'),
        Query.limit(1),
      ],
    });
    if (rows.length === 0) return 1000;
    return edge === 'top' ? rows[0].position - 1000 : rows[0].position + 1000;
  }

  /** One row per change: the timeline that everyone on the board sees. */
  function addStep(kind, cardId, summary) {
    return tablesDB.createRow({
      ...STEPS,
      rowId: ID.unique(),
      data: { runId: run.$id, boardId: board.id, cardId, kind, summary: shorten(summary, 300) },
      permissions: [Permission.read(Role.team(board.teamId))],
    });
  }

  const handlers = {
    async update_card({ cardId, status, priority, label, assigneeId, note }) {
      const card = await boardCard(cardId);
      checkFields({ status, priority, label, assigneeId });

      const update = {};
      if (status !== null && status !== card.status) update.status = status;
      if (priority !== null && priority !== card.priority) update.priority = priority;
      if (label !== null && label !== card.label) update.label = label;
      if (assigneeId !== null && assigneeId !== card.assigneeId) update.assigneeId = assigneeId;
      const agentNote = note?.trim() ? shorten(note.trim(), 280) : null;
      if (
        Object.keys(update).length === 0 &&
        (agentNote === null || agentNote === card.agentNote)
      ) {
        return { ok: true, unchanged: true, card: compactCard(card) };
      }

      if (run.kind === 'triage') {
        if (inbox.has(card.$id)) triaged.add(card.$id);
        await presence.set({
          cardId: card.$id,
          field: null,
          activity: `Triaging ${triaged.size} of ${inbox.size} cards`,
          progress: { done: triaged.size, total: inbox.size },
        });
      } else {
        await presence.set({
          cardId: card.$id,
          field: null,
          activity: `Updating ${cardLabel(card.title)}`,
        });
      }

      if (update.status) update.position = await position(update.status, 'top');
      const updated = await tablesDB.updateRow({
        ...CARDS,
        rowId: card.$id,
        data: { ...update, agentNote, editedBy: board.agentId, runId: run.$id },
      });
      changes++;

      const details = [
        update.priority && PRIORITY_NAMES[update.priority],
        update.label && LABEL_NAMES[update.label],
        update.assigneeId && personName(update.assigneeId),
      ].filter(Boolean);
      const action = update.status
        ? `Moved ${cardLabel(card.title)} to ${COLUMNS[update.status]}`
        : details.length > 0
          ? `Updated ${cardLabel(card.title)}`
          : `Added a note to ${cardLabel(card.title)}`;
      await addStep('update', card.$id, [action, ...details].join(' · '));

      return { ok: true, card: compactCard(updated) };
    },

    async create_card({ title, status, priority, label, assigneeId, parentCardId, note }) {
      check(
        created < MAX_NEW_CARDS,
        `You already created ${MAX_NEW_CARDS} cards for this request. Do not create more.`,
      );
      const cardTitle = typeof title === 'string' ? shorten(title.trim(), 160) : '';
      check(cardTitle, 'The title is empty.');
      check(status !== null && priority !== null, 'Set a status and a priority.');
      checkFields({ status, priority, label, assigneeId });
      if (run.kind === 'split') {
        check(
          parentCardId === target.$id,
          `Set parentCardId to ${target.$id}, the card you are splitting.`,
        );
      }
      const parent = parentCardId === null ? null : await boardCard(parentCardId);

      await presence.set({
        cardId: parent?.$id ?? null,
        field: null,
        activity:
          run.kind === 'split'
            ? `Creating subtasks for ${cardLabel(target.title)}`
            : `Creating ${cardLabel(cardTitle)}`,
      });

      const card = await tablesDB.createRow({
        ...CARDS,
        rowId: ID.unique(),
        data: {
          boardId: board.id,
          title: cardTitle,
          status,
          position: await position(status, 'bottom'),
          priority,
          label,
          assigneeId,
          parentId: parent?.$id ?? null,
          agentNote: note?.trim() ? shorten(note.trim(), 280) : null,
          createdBy: board.agentId,
          editedBy: board.agentId,
          runId: run.$id,
        },
        permissions: teamPermissions,
      });
      created++;
      changes++;
      await addStep('create', card.$id, `Created ${cardLabel(card.title)} in ${COLUMNS[status]}`);

      return { ok: true, card: compactCard(card) };
    },

    async write_description({ cardId, brief }) {
      const card = await boardCard(cardId);
      if (run.kind === 'draft') {
        check(card.$id === target.$id, `This request is only about ${cardLabel(target.title)}.`);
      }

      // Presence tells the agent what people are doing right now. It never
      // writes over a description that someone is typing.
      const editor = await personEditing(card.$id, 'description');
      if (editor) {
        await addStep(
          'skip',
          card.$id,
          `Skipped ${cardLabel(card.title)}: ${editor} is editing the description`,
        );
        return { skipped: true, reason: `${editor} is editing this description.` };
      }

      await presence.set({
        cardId: card.$id,
        field: 'description',
        activity: `Writing the description of ${cardLabel(card.title)}`,
      });
      const writer = createRowWriter({
        tablesDB,
        table: CARDS,
        rowId: card.$id,
        column: 'description',
      });
      let updated;
      try {
        const message = await streamCompletion({
          openai,
          deadline,
          messages: [
            { role: 'system', content: DESCRIPTION_PROMPT },
            {
              role: 'user',
              content: descriptionMessage(board, card, typeof brief === 'string' ? brief : ''),
            },
          ],
          onText: (text) => writer.write(text),
        });
        const description = message.content?.trim();
        check(description, 'The description came back empty. Try again with a clearer brief.');
        updated = await writer.flush(description, { editedBy: board.agentId, runId: run.$id });
      } catch (err) {
        // Put the old description back instead of leaving half a draft.
        await writer.flush(card.description ?? null);
        throw err;
      } finally {
        await presence.set({ field: null });
      }
      changes++;
      await addStep('write', card.$id, `Wrote the description of ${cardLabel(card.title)}`);

      return { ok: true, card: compactCard(updated) };
    },
  };

  /** The name of a teammate who is editing this field of the card, if any. */
  async function personEditing(cardId, field) {
    let cursor = null;
    for (;;) {
      const { presences: editing } = await presences.list({
        queries: [
          Query.equal('status', ['editing']),
          Query.limit(100),
          ...(cursor ? [Query.cursorAfter(cursor)] : []),
        ],
      });
      const person = editing.find(
        ({ userId, metadata }) =>
          metadata?.cardId === cardId && metadata?.field === field && personName(userId),
      );
      if (person) return personName(person.userId);
      if (editing.length < 100) return null;
      cursor = editing.at(-1).$id;
    }
  }

  return {
    /** The number of cards the agent created or changed so far. */
    get changes() {
      return changes;
    },

    /** Runs one tool call and returns the result for the model. */
    async run(call) {
      try {
        check(
          allowed.has(call.function.name),
          `There is no tool named ${call.function.name} for this request.`,
        );
        let args;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          throw new ToolError('The arguments are not valid JSON.');
        }
        return await handlers[call.function.name](args);
      } catch (err) {
        if (err instanceof ToolError) return { error: err.message };
        if (err instanceof UnreadableOutputError)
          return { error: 'The text could not be read. Try again.' };
        throw err;
      }
    },
  };
}
