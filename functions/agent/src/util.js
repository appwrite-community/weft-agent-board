/** Appwrite IDs: up to 36 characters, a-z, A-Z, 0-9, period, hyphen, underscore. */
export function isId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value);
}

/** Resolves to null when Appwrite answers 404. */
export async function orNull(request) {
  try {
    return await request;
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
  }
}

/**
 * A short, safe description of an error for the execution logs. Never log
 * the whole error object: Appwrite and model errors can include the request.
 */
export function describeError(err) {
  const label = [err?.code ?? err?.status, err?.type].filter(Boolean).join(' ') || err?.name;
  return `${label}: ${err?.message ?? String(err)}`;
}

export function shorten(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export const now = () => new Date().toISOString();
