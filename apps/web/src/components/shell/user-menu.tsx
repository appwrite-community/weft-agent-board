import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { Avatar } from '@/components/brand/avatar';
import { useBoard } from '@/components/board/board-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/menu';
import { clearPresence } from '@/hooks/use-presence';
import { account, realtime } from '@/lib/appwrite';
import { accountQuery } from '@/lib/queries';

/** Removes the presence first, while the session can still delete it. */
function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    const user = queryClient.getQueryData(accountQuery.queryKey);
    if (user) await clearPresence(user.$id);
    await account.deleteSession({ sessionId: 'current' }).catch(() => undefined);
    await realtime.disconnect();
    queryClient.clear();
    await navigate({ to: '/sign-in', search: {} });
  };
}

export function UserMenu() {
  const { me, memberById } = useBoard();
  const signOut = useSignOut();
  const member = memberById.get(me.$id) ?? {
    userId: me.$id,
    name: me.name,
    isAgent: false,
    color: '#a1a1aa',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-90"
      >
        <Avatar member={member} size={28} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar member={member} size={32} />
          <div className="min-w-0">
            <p className="truncate text-13 font-medium">{me.name}</p>
            <p className="truncate text-12 text-subtle">{me.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SignOutButton() {
  const signOut = useSignOut();
  return (
    <Button variant="secondary" onClick={signOut}>
      <LogOutIcon />
      Sign out
    </Button>
  );
}
