# Workflow Inbox

An internal inbox where people review and act on pending work raised by other systems: approve expenses, review deployments, submit documentation. Items are listed by what to do next, handled in a split view, and failed actions can be retried or dismissed.

Run it with `pnpm install && pnpm dev`: the API is at http://localhost:3001 and the web app at http://localhost:5173. Checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`.

Vocabulary is in [GLOSSARY.md](GLOSSARY.md). Decisions are recorded in [docs/adr](docs/adr):

- [0001 Events and action execution sit behind ports](docs/adr/0001-events-and-execution-behind-ports.md)
- [0002 Item types are typed code modules](docs/adr/0002-item-types-are-code-modules.md)
- [0003 A failed action returns 200 with a failed item](docs/adr/0003-failed-action-is-200.md)

## Architecture

A pnpm workspace with three packages:

- `packages/contracts`: Zod schemas shared by both sides (items, actions, queries, events, problem details). The single source of truth for types and validation.
- `packages/api`: Hono server. `routes` validate input and map domain errors to Problem Details responses, `service` owns the business rules and the state machine, `repository` is an interface with an in-memory implementation. Execution and events go through two ports, `Executor` (inline in v1) and `EventPublisher` (in-process, no subscribers). Everything is wired in `composition-root.ts`.
- `packages/web`: React, Vite, TanStack Query, React Router, Tailwind. Organised as `app` (shell, providers, routes), `features/inbox` (sidebar, filters, list, detail, item type modules) and `shared` (accessibility helpers, API client, UI primitives).

Import boundaries, enforced by ESLint (`eslint.config.js`):

- a feature may import from `shared`, not from `app` or from other features;
- `shared` never imports from features.

Contracts are imported by both `api` and `web`; the two never import each other.

## Intake

Other systems raise items with `POST /api/items`. There is no UI for it. The server assigns `id`, `status` (`pending`), and timestamps; `dueDate` (`YYYY-MM-DD`) is optional. It responds `201` with the item, or `400` with Problem Details when the body is invalid.

```sh
curl -X POST http://localhost:3001/api/items -H 'content-type: application/json' -d '{
  "type": "expense", "title": "Approve Acme travel", "priority": "high",
  "requester": "Maria Lopez", "dueDate": "2026-12-01",
  "payload": { "merchant": "Acme Travel", "category": "Travel", "amount": 120.5, "currency": "EUR" }
}'
```

Payload per type:

- `expense`: `{ "merchant": "Acme Travel", "category": "Travel", "amount": 120.5, "currency": "EUR" }`
- `deployment`: `{ "service": "billing-api", "environment": "production", "version": "2.4.0" }` (`environment` is `production` or `staging`)
- `documentation`: `{ "topic": "Onboarding flow", "audience": "New hires" }`

`priority` is `urgent`, `high`, `normal` or `low`.

Actions are submitted with `POST /api/items/:id/actions` (`{ "action": "approve" }`, `{ "action": "reject", "input": { "reason": "..." } }`, `request_changes` with `comment`, `submit` with `link` and optional `note`, and `retry` or `dismiss` on failed items). A deployment with `request_changes` completes with outcome `rejected`.

Events published to the `EventPublisher` port: `item.created`, `item.completed`, `item.failed`, each carrying the item. Nothing subscribes in v1.

## Adding an item type

Each step fails to compile until done, so the compiler lists what is missing.

1. `packages/contracts/src/item.ts`: add the item schema (envelope plus `payload`), add it to `itemSchema`, and add `<type>ItemSchema.pick(intakeFields).extend(intakeDueDate)` to `createItemRequestSchema`.
2. `packages/contracts/src/action.ts`: define the action schema and add it to `actionSchemas`.
3. `packages/api/src/executor/inline-executor.ts`: add an entry to `typeExecutors`.
4. `packages/api/src/seed.ts`: add a seed helper and a few items.
5. `packages/web/src/features/inbox/item-types`: add the `Detail` and `ActionForm` components and register `{ label, Detail, ActionForm }` in `itemTypeModules` (`index.ts`).

The list, views, filters, counts and the failure and retry flow need no changes.

## Known gaps

- On narrow screens the sidebar keeps its fixed width and does not collapse; list and detail are separate pages as intended.
- Colour contrast is covered by design tokens but not by the automated axe check, which cannot compute it in jsdom.

## Iteration 2

- Realtime delivery of item events (polling or SSE)
- Optimistic concurrency, so two people cannot overwrite each other
- A current user, so items and decisions have an identity
- Async execution with the `processing` status
- A database in place of the in-memory repository
- Configuration (API URL, seed data; only PORT is configurable today) instead of constants
- Dark mode (tokens are already CSS variables)
- Onboarding item type
- End-to-end tests
