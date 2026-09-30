import { Client, Functions, Presences, TablesDB, Teams, Users } from 'node-appwrite';
import OpenAI from 'openai';

/**
 * Appwrite clients that use the function's dynamic API key. The key has
 * exactly the scopes set in the function settings.
 */
export function createClients(apiKey) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(apiKey);

  return {
    tablesDB: new TablesDB(client),
    teams: new Teams(client),
    users: new Users(client),
    presences: new Presences(client),
    functions: new Functions(client),
  };
}

/**
 * OpenRouter speaks the OpenAI Chat Completions API, so the OpenAI SDK works
 * with a different base URL.
 */
export function createModel() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    maxRetries: 2,
    timeout: 60_000,
  });
}
