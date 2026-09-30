# Weft: an AI agent that works live next to your team

Weft is a planning board where a small product team and an AI agent work on the same cards. People ask
the agent to triage the inbox, split a card into subtasks, draft a description, or write a standup
summary. Everyone on the board sees the agent's avatar next to the people, reads what it is doing right
now, and watches each change land on the board as it happens.

It is built with Appwrite:

- **Presences** show who is on the board and what they are doing, including the agent.
- **Realtime** delivers every card change, run update, and timeline step to every open board.
- **TablesDB** stores boards, cards, the agent's runs, and the steps of each run.
- **Functions** run the agent: one `agent` function queues requests, runs one request per team at a
  time, and recovers from crashed runs.
- **Teams** hold the people and the agent. The agent is a user of its own with the team role `agent`.

The model is GPT-6 Luna through OpenRouter.

## How it works

1. A person asks the agent for something. The web app calls the `agent` function at `POST /runs`.
   Appwrite adds the person's user ID to the request, and the function checks that the person is a
   member of the board's team.
2. The function saves the request as a queued row in `runs` and starts an asynchronous execution of
   itself that drains the team's queue.
3. The drain claims the run with one `createRow` call in `active_runs`. The row ID is the run ID, and a
   unique index on `teamId` allows one active run per team, so two requests never run at the same time.
4. The agent loop calls the model with tools that fit the request. Every change is a row write, and the
   agent's presence says which card it works on ("Triaging 3 of 6 cards"). The reply streams into the
   run row.
5. When the run ends, the function deletes the agent's presence and releases the team. A schedule every
   five minutes fails runs whose execution crashed, removes their presence, and starts queued runs.

People announce their own presence over the Realtime socket, so it disappears when they close the tab.
Before the agent writes a description, it checks the presences and skips the card if a person is editing
that description.

## Layout

- `apps/web`: the React app (Vite, TanStack Router and Query, Tailwind CSS, shadcn/ui).
- `functions/agent/src/main.js`: routes `POST /runs`, `POST /runs/stop`, `POST /drain`, and the schedule.
- `functions/agent/src/runs.js`: the queue, the team claim, stop requests, and crash recovery.
- `functions/agent/src/agent.js`: the agent loop.
- `functions/agent/src/tools.js`: the tools and the rules they enforce.
- `functions/agent/src/presence.js`: the agent's presence.
- `functions/agent/src/writer.js`: streams text into a row column.
- `functions/agent/src/board.js`, `prompts.js`, `model.js`: board context, prompts, and model calls.
- `scripts/provision.ts`: creates the database, tables, indexes, the membership privacy policy, and the
  function, then deploys the function.
- `scripts/seed.ts`: creates the demo team, four people, the agent user, three boards, and their cards.

## Setup

You need Node.js 22 or later, pnpm, an [Appwrite Cloud](https://cloud.appwrite.io) project, and an
[OpenRouter](https://openrouter.ai) API key.

1. In the Appwrite Console, create a project. Add a **Web** platform with the hostname `localhost`.
2. Create an API key with these scopes: `databases.read`, `databases.write`, `tables.read`,
   `tables.write`, `columns.read`, `columns.write`, `indexes.read`, `indexes.write`, `rows.read`,
   `rows.write`, `users.read`, `users.write`, `teams.read`, `teams.write`, `functions.read`,
   `functions.write`, `project.policies.write`, and `presences.write`.
3. Copy `.env.example` to `.env` and fill in the values. `DEMO_PASSWORD` is the password of the four demo
   accounts.
4. Install the dependencies, create the resources, and add the demo data:

   ```bash
   pnpm install
   pnpm run provision
   pnpm run seed
   ```

   `provision` stores `OPENROUTER_API_KEY` as a secret variable of the function. You can run it again at
   any time: it creates what is missing, updates the function settings, and deploys the function code.

5. Start the app and open `http://localhost:5173`:

   ```bash
   pnpm run dev
   ```

6. Sign in as `maya@example.com` in one browser and as `theo@example.com` in another, with the password
   from `DEMO_PASSWORD`. Open the same board in both, then ask the agent to triage the inbox.

## Commands

- `pnpm run dev`: starts the web app.
- `pnpm run build`: builds the web app.
- `pnpm run provision`: creates or updates the Appwrite resources and deploys the function.
- `pnpm run seed`: adds the demo team, people, boards, and cards that are missing.
- `pnpm run reset`: restores every demo card and removes the agent's cards, runs, and steps.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run format`: code checks.

## Security notes

- Only the function writes `runs` and `steps`. Clients can read them but cannot change them, so the
  agent's timeline is a record people can trust.
- Any signed-in user can create a card, but only a member of a team can give that team access to it. The
  function reads cards with an API key, so it keeps only cards the board's team can read. Card text is
  treated as information for the model, not as instructions.
- Each kind of request gets only the tools it needs, and no tool deletes cards.
- The demo accounts share one password from `.env`. The app never includes it in the browser bundle.

## License

MIT
