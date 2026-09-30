import { useEffect, useState } from 'react';

/** How long the text must stay unchanged before the stream counts as finished. */
const SETTLE_MS = 1500;

/**
 * The state of a field the agent streams into. The agent's presence says when
 * it starts and stops writing, but the text arrives as separate row events
 * that can land after the presence changes. So the field stays in its writing
 * state until the text has been quiet for a moment, and the text it had
 * before the agent started is not shown as the agent's writing.
 */
export function useAgentStream(active: boolean, text: string) {
  const [wasActive, setWasActive] = useState(active);
  const [startText, setStartText] = useState<string | null>(active ? text : null);
  const [settling, setSettling] = useState(false);

  if (active !== wasActive) {
    setWasActive(active);
    if (active) {
      setStartText(text);
      setSettling(false);
    } else {
      setSettling(true);
    }
  }

  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(() => {
      setSettling(false);
      setStartText(null);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [settling, text]);

  const writing = active || settling;
  return { writing, streamed: writing && text !== startText ? text : '' };
}
