import { useSyncExternalStore } from 'react';
import { realtime } from './appwrite';

/**
 * The state of the Realtime connection: `live`, `offline` after the socket
 * closed, and `syncing` after it opened again while the app refetches what
 * it missed. The SDK reconnects on its own.
 */
export type ConnectionState = 'live' | 'offline' | 'syncing';

let state: ConnectionState = 'live';
const listeners = new Set<() => void>();

export function setConnectionState(next: ConnectionState) {
  if (next === state) return;
  state = next;
  listeners.forEach((listener) => listener());
}

realtime.onClose(() => setConnectionState('offline'));
realtime.onOpen(() => {
  if (state === 'offline') setConnectionState('syncing');
});

export function useConnectionState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
