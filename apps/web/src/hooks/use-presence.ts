import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Channel, Permission, Role, type RealtimeResponseEvent } from 'appwrite';
import { useEffect, useMemo, useState } from 'react';
import { presences, realtime } from '@/lib/appwrite';
import { presencesQuery } from '@/lib/queries';
import type { Presence, PresenceMetadata } from '@/lib/types';

type Announcement = {
  userId: string;
  teamId: string;
  status: 'viewing' | 'editing';
  metadata: PresenceMetadata;
};

let lastAnnouncement: Announcement | null = null;

/**
 * Tells the team where this person is and what they edit. The presence goes
 * over the Realtime socket, so Appwrite removes it when the tab closes.
 *
 * With explicit permissions, Appwrite stores exactly the permissions you pass.
 * The person needs update and delete on their own record to change it later.
 */
export function announcePresence(announcement: Announcement) {
  const { userId, teamId, status, metadata } = announcement;
  lastAnnouncement = announcement;
  return realtime.upsertPresence({
    presenceId: userId,
    status,
    metadata,
    permissions: [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  });
}

/** Removes this person's presence when they sign out. */
export async function clearPresence(userId: string) {
  lastAnnouncement = null;
  try {
    await presences.delete({ presenceId: userId });
  } catch {
    // Already gone: the socket closed first.
  }
}

/**
 * Keeps the presences of the user's teams in the query cache: subscribe
 * first, then list, so no change between the two is lost. Appwrite keeps one
 * presence per user, so entries are keyed by user ID.
 */
export function usePresenceFeed(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Users that changed after the list request started. Their event is newer
    // than anything the list can return.
    let changedDuringList: Set<string> | null = null;
    let active = true;

    const onEvent = ({ events, payload }: RealtimeResponseEvent<Presence>) => {
      const removed = events.some((name) => name.endsWith('.delete'));
      changedDuringList?.add(payload.userId);
      queryClient.setQueryData<Presence[]>(presencesQuery.queryKey, (list = []) => {
        const others = list.filter((presence) => presence.userId !== payload.userId);
        return removed ? others : [...others, payload];
      });
      // Another tab of this person closed and took the shared record with it.
      if (removed && payload.userId === userId && lastAnnouncement) {
        announcePresence(lastAnnouncement);
      }
    };

    const subscription = realtime.subscribe(Channel.presences(), onEvent);
    subscription.then(async () => {
      changedDuringList = new Set();
      const listed = await queryClient.fetchQuery({ ...presencesQuery, staleTime: 0 });
      const changed = changedDuringList;
      changedDuringList = null;
      if (!active) return;
      queryClient.setQueryData<Presence[]>(presencesQuery.queryKey, (current = []) => [
        ...listed.filter((presence) => !changed.has(presence.userId)),
        ...current.filter((presence) => changed.has(presence.userId)),
      ]);
    });

    return () => {
      active = false;
      subscription.then(({ unsubscribe }) => unsubscribe());
    };
  }, [queryClient, userId]);
}

/**
 * The presences that have not expired. An expired presence gets no Realtime
 * event, so the app hides it when its `expiresAt` passes: one timer, set to
 * the soonest expiry.
 */
export function useLivePresences() {
  const { data = [] } = useQuery({ ...presencesQuery, enabled: false });
  const [now, setNow] = useState(() => Date.now());

  const live = useMemo(
    () => data.filter((presence) => !presence.expiresAt || Date.parse(presence.expiresAt) > now),
    [data, now],
  );

  useEffect(() => {
    const soonest = Math.min(
      ...live.map((presence) => (presence.expiresAt ? Date.parse(presence.expiresAt) : Infinity)),
    );
    if (!Number.isFinite(soonest)) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, soonest - Date.now()) + 50);
    return () => clearTimeout(timer);
  }, [live]);

  return live;
}
