import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { AppwriteException } from 'appwrite';
import { AlertCircleIcon } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { Avatar } from '@/components/brand/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { account } from '@/lib/appwrite';
import { setConnectionState } from '@/lib/connection';
import { DEMO_PEOPLE } from '@/lib/demo';
import { setSessionHint } from '@/lib/session';
import { accountQuery } from '@/lib/queries';

type SignInSearch = { redirect?: string };

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.ensureQueryData(accountQuery)) throw redirect({ to: '/' });
  },
  component: SignIn,
});

function signInError(err: unknown) {
  if (err instanceof AppwriteException) {
    if (err.code === 401 || err.code === 400) return 'Email or password is incorrect.';
    if (err.code === 429) return 'Too many attempts. Wait a minute and try again.';
    if (err.code >= 500) return 'Weft is having trouble signing you in. Try again in a moment.';
  }
  return "Can't reach Weft. Check your connection and try again.";
}

function SignIn() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await account.createEmailPasswordSession({ email: email.trim(), password });
      setSessionHint(true);
      queryClient.setQueryData(accountQuery.queryKey, await account.get());
      setConnectionState('live');
      if (redirectTo?.startsWith('/')) await navigate({ href: redirectTo, replace: true });
      else await navigate({ to: '/', replace: true });
    } catch (err) {
      setError(signInError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="dotted-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-agent/[0.07] blur-3xl"
      />

      <main className="relative w-full max-w-100">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <LogoMark size={28} />
          <Wordmark className="text-20" />
        </div>

        <div className="rounded-2xl border border-border bg-popover/80 p-6 shadow-dialog backdrop-blur-sm">
          <h1 className="text-24 font-semibold tracking-[-0.02em]">Sign in to Weft</h1>
          <p className="mt-1.5 text-13 text-muted">
            Plan with your team and an AI agent on one live board.
          </p>

          <form className="mt-6 space-y-4" onSubmit={signIn} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-12 font-medium text-muted">Email</span>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-12 font-medium text-muted">Password</span>
              <Input
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-13 text-[#fca5a5]"
              >
                <AlertCircleIcon className="mt-px size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting && <Spinner />}
              Sign in
            </Button>
          </form>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-surface/80 p-2 backdrop-blur-sm">
          <div className="flex items-baseline justify-between px-3 pt-2 pb-2">
            <h2 className="text-12 font-medium text-muted">Demo workspace</h2>
            <span className="text-11 text-subtle">Fernway</span>
          </div>
          <ul>
            {DEMO_PEOPLE.map((person) => (
              <li key={person.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(person.email);
                    setError(null);
                    passwordRef.current?.focus();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-card-hover"
                >
                  <Avatar
                    member={{
                      userId: person.email,
                      name: person.name,
                      color: person.color,
                      isAgent: false,
                    }}
                    size={28}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-13 font-medium">{person.name}</span>
                    <span className="block truncate text-12 text-subtle">{person.title}</span>
                  </span>
                  <span className="font-mono text-11 text-subtle">{person.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
