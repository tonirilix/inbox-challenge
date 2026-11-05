# Architecture

How the code is organised and why. For vocabulary see [GLOSSARY.md](GLOSSARY.md); for the reasoning behind the bigger choices see [docs/adr](docs/adr).

## Layout

```
packages/
  contracts/   Zod schemas shared by api and web (the source of truth for types)
  api/         Hono server: routes -> service -> repository
  web/         React app: app / features/inbox / shared
```

`api` and `web` both import `contracts`. They never import each other.

## API

```
routes  ->  service  ->  repository (interface, in-memory implementation)
                |
                +-->  Executor port        (carries out an action; inline in v1)
                +-->  EventPublisher port  (receives events; nobody listens in v1)
```

- **routes** (`routes/items.ts`) parse input and turn domain errors into Problem Details (`routes/problem.ts`). No business rules.
- **service** (`service/item-service.ts`) owns the rules and the state machine below.
- **repository** is an interface; swapping the in-memory one for a database should not touch the service.
- **composition root** (`composition-root.ts`) wires everything with constructor arguments. No DI container. Tests build the app with fakes through the same function.
- **ports** exist so execution can become async and events can reach a realtime transport later without changing the service ([ADR 0001](docs/adr/0001-events-and-execution-behind-ports.md)).

### Endpoints

| Method and path | What it does |
| --- | --- |
| `GET /api/items?status=&type=&priority=&q=` | List one view's items. `status` is required; filters combine with AND |
| `GET /api/items/counts` | Count per status. Ignores filters |
| `GET /api/items/:id` | One item |
| `POST /api/items` | Intake: create a pending item (201) |
| `POST /api/items/:id/actions` | Submit an action, including `retry` and `dismiss` |

Errors are Problem Details: 400 invalid input, 404 unknown item, 409 the item does not accept that action (the body includes `itemStatus`). A failed execution is **not** an error: it returns 200 with the item in `failed` status ([ADR 0003](docs/adr/0003-failed-action-is-200.md)).

## State machine

```
              action ok
  pending ───────────────────────────► completed (outcome)
     │                                     ▲
     │ action fails                        │ retry succeeds
     ▼                                     │ dismiss  (outcome: dismissed)
  failed ──────────────────────────────────┘
     │  ▲
     └──┘ retry fails again
```

- **pending** accepts the actions of its item type. Success completes it with an outcome; a failure moves it to `failed` with a reason.
- **failed** accepts only `retry` (replays the last attempt with the same action and input) or `dismiss` (completes with outcome `dismissed`). Anything else is 409.
- **completed** is terminal. Any action is 409.
- **processing** exists as a status but the v1 executor is inline, so it is never visible beyond one request.
- Only the last attempt is stored. Every transition sets `updatedAt`, which drives ordering in the Failed and Completed views.
- Check order in `submitAction`: 404, then 409, then 400.

## Item types

A type is a set of typed code modules, not configuration ([ADR 0002](docs/adr/0002-item-types-are-code-modules.md)). Adding one touches five places, and the compiler reports each one still missing:

1. `contracts/item.ts`: item schema, added to `itemSchema` and to the intake schema.
2. `contracts/action.ts`: action schema, added to `actionSchemas`.
3. `api/executor/inline-executor.ts`: an entry in `typeExecutors`.
4. `api/seed.ts`: a seed helper and some items.
5. `web/features/inbox/item-types/`: `Detail` and `ActionForm`, registered in `itemTypeModules`.

Lists, views, filters, counts and the failure flow need no change. The web app shows a generic card for a type it does not know.

## Web

```
src/
  app/               shell, providers, routes (the only place that mounts features)
  features/inbox/    components, hooks, utils, item-types
  shared/            a11y helpers, api client, ui primitives, lib
```

Import rules, enforced by ESLint (`eslint.config.js`):

- a feature imports from `shared`, never from `app` or another feature;
- `shared` never imports from a feature.

Move something to `shared` only when a second feature needs it. Prefer composition (children, slots) over long prop lists.

### Routing and state

- URL is the state: `/:view` and `/:view/:itemId`, with filters in the query string (`?type=&priority=&q=`). `/` redirects to `/pending`. Links between list and detail keep the query string.
- Server state is TanStack Query. Keys come from `itemKeys` in `hooks/use-items.ts`. After any action, invalidate `lists()`, `counts()` and the item's detail key.
- Data refetches on window focus. There is no push channel in v1.
- The item moves only when the server answers; nothing is optimistic.

### Accessibility behaviour to preserve

- Landmarks and a skip link past the sidebar; the sidebar is a labelled `nav`, with the count in each link's accessible name ("Pending, 2 items").
- One polite announcer (`shared/a11y/announcer.tsx`, `useAnnounce()`) for outcomes and result counts. Do not add more live regions.
- After completing or dismissing an item, focus moves to the next row, or to the list heading when none remain.
- The busy state shows only after about 300 ms (`use-delayed-flag.ts`), so quick actions do not flicker.
- Priority uses label and icon; colour only for urgent and high. Status and outcome are text, a different channel from priority.

## Tests

Two seams, both through public behaviour:

- **API**: requests to `createApp(...)` with the in-memory repository and fakes for the ports where needed (`packages/api/test`).
- **Web**: the inbox rendered with `fetch` faked via `src/test/fake-api.ts`, driven like a user, plus axe checks.

Run everything with `pnpm test`, `pnpm typecheck`, `pnpm lint`.
