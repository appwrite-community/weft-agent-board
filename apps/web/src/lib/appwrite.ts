import { Account, Client, Functions, Presences, Realtime, TablesDB, Teams } from 'appwrite';

export const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const teams = new Teams(client);
export const functions = new Functions(client);
export const presences = new Presences(client);
export const realtime = new Realtime(client);

export const DATABASE_ID = 'weft';
export const AGENT_FUNCTION_ID = 'agent';

export const table = (tableId: 'boards' | 'cards' | 'runs' | 'steps') => ({
  databaseId: DATABASE_ID,
  tableId,
});
