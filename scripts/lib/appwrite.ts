import { Client, Functions, Presences, Project, TablesDB, Teams, Users } from 'node-appwrite';
import { requireEnv } from './env.ts';

const client = new Client()
  .setEndpoint(requireEnv('APPWRITE_ENDPOINT'))
  .setProject(requireEnv('APPWRITE_PROJECT_ID'))
  .setKey(requireEnv('APPWRITE_API_KEY'));

export const tablesDB = new TablesDB(client);
export const users = new Users(client);
export const teams = new Teams(client);
export const presences = new Presences(client);
export const functions = new Functions(client);
export const project = new Project(client);

export const DATABASE_ID = 'weft';

/** Returns null instead of throwing when Appwrite answers 404. */
export async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (err) {
    if (isAppwriteError(err) && err.code === 404) return null;
    throw err;
  }
}

export function isAppwriteError(
  err: unknown,
): err is { code: number; type: string; message: string } {
  return typeof err === 'object' && err !== null && 'code' in err && 'type' in err;
}
