/**
 * Remembers that this browser has a session, so a signed-out visit goes
 * straight to the sign-in page instead of asking Appwrite for an account
 * it doesn't have.
 */
const KEY = 'weft:signed-in';

export const hasSessionHint = () => localStorage.getItem(KEY) === 'true';
export const setSessionHint = (signedIn: boolean) =>
  signedIn ? localStorage.setItem(KEY, 'true') : localStorage.removeItem(KEY);
