import { existsSync } from 'node:fs';

// Scripts and the web app share one .env file in the repository root.
// Variables that are already set in the shell take precedence.
const envFile = new URL('../../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in the .env file in the repository root.`);
  return value;
}
