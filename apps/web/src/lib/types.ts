import type { Models } from 'appwrite';

export type CardStatus = 'inbox' | 'next' | 'doing' | 'done';
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type Label = 'bug' | 'feature' | 'design' | 'ops' | 'qa';
export type RunKind = 'triage' | 'split' | 'draft' | 'summary' | 'ask';
export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'stopped';
export type StepKind = 'update' | 'create' | 'write' | 'skip';

export type Board = Models.Row & {
  teamId: string;
  name: string;
  description: string | null;
};

export type Card = Models.Row & {
  boardId: string;
  title: string;
  description: string | null;
  status: CardStatus;
  position: number;
  priority: Priority;
  label: Label | null;
  assigneeId: string | null;
  parentId: string | null;
  dueAt: string | null;
  agentNote: string | null;
  createdBy: string;
  editedBy: string | null;
  runId: string | null;
};

export type Run = Models.Row & {
  boardId: string;
  teamId: string;
  kind: RunKind;
  cardId: string | null;
  prompt: string | null;
  requestedBy: string;
  status: RunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  reply: string | null;
  error: string | null;
  stoppedBy: string | null;
};

export type Step = Models.Row & {
  runId: string;
  boardId: string;
  cardId: string | null;
  kind: StepKind;
  summary: string;
};

export type EditableField = 'title' | 'description';

/** What a person or the agent shares about itself through its presence. */
export type PresenceMetadata = {
  boardId: string | null;
  cardId: string | null;
  field: EditableField | null;
  /** Agent only: what it does now, for example "Triaging 3 of 6 cards". */
  activity?: string | null;
  progress?: { done: number; total: number } | null;
  runId?: string | null;
};

export type Presence = Omit<Models.Presence, 'metadata'> & {
  metadata?: Partial<PresenceMetadata>;
};

/** A team member as the app shows them. */
export type Member = {
  userId: string;
  name: string;
  isAgent: boolean;
  /** Presence color for people; the agent is always teal. */
  color: string;
};
