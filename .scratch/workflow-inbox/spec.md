Status: ready-for-agent

# Workflow Inbox v1

## Problem Statement

People in an operations team receive pending work from many systems: expenses to approve, deployments to review, documentation to submit. That work is scattered, so it is hard to know what needs attention first, what is overdue, what already failed and what was already handled. When someone acts on an item and the underlying operation fails, there is no clear place to see it or recover from it. Two people can also try to handle the same item without knowing.

## Solution

A single inbox where all pending **items** are listed in one place, ordered so the top of the list is what to do next. The user picks a **view** (Pending, Failed, Completed) in a sidebar, narrows it with **filters** (item type, priority, search), and works through items in a split view: the list on one side, the selected item's details and available **actions** on the other. Acting on an item records an **outcome** and moves it to Completed. If the system cannot carry the action out, the item moves to Failed with the reason, where the user can **retry** or **dismiss** it. Everything is keyboard-operable and announced to assistive technology, and after finishing an item focus moves to the next one.

## User Stories

1. As an inbox user, I want to see all my pending items in one list, so that I don't have to check several systems.
2. As an inbox user, I want the list ordered by priority and then due date, so that the top item is what I should do next.
3. As an inbox user, I want each item to show its type, title, requester, priority and due date, so that I can recognise it without opening it.
4. As an inbox user, I want urgent and high priority items to stand out, so that I notice them without every row being coloured.
5. As an inbox user, I want priority to be shown with a label and an icon as well as colour, so that I can tell priorities apart without relying on colour.
6. As an inbox user, I want overdue items clearly marked with how late they are, so that I can handle them before others of the same priority.
7. As an inbox user, I want to open an item and see all of its details next to the list, so that I can decide without losing my place.
8. As an inbox user, I want each item to have its own URL, so that I can share it and use the back button.
9. As an inbox user, I want to approve an expense, so that the requester can be reimbursed.
10. As an inbox user, I want to reject an expense and be required to give a reason, so that the requester understands the decision.
11. As an inbox user, I want to approve a deployment, so that it can go ahead.
12. As an inbox user, I want to request changes on a deployment with a comment, so that the requester knows what to fix.
13. As an inbox user, I want to complete a documentation item by submitting a link and an optional note, so that the request is fulfilled.
14. As an inbox user, I want invalid input (a missing reason, a malformed link) explained next to the field, so that I can fix it immediately.
15. As an inbox user, I want a completed item to leave the Pending view right away, so that my list only shows work that remains.
16. As an inbox user, I want focus to move to the next item after I complete one, so that I can keep working without hunting for my place.
17. As a screen reader user, I want the outcome and the next item announced after completing an item, so that I know what happened and where I am.
18. As an inbox user, I want to see items whose action failed in a separate Failed view, so that I can find them quickly.
19. As an inbox user, I want the Failed count to be easy to notice in the sidebar, so that I know something needs my attention.
20. As an inbox user, I want a failed item to show why it failed and what I last tried, so that I can decide what to do.
21. As an inbox user, I want to retry a failed item with the same action and input, so that a temporary problem doesn't force me to start over.
22. As an inbox user, I want to dismiss a failed item, so that I can close something I no longer want to retry.
23. As an inbox user, I want a dismissed item to appear in Completed with the outcome dismissed, so that there is still a record of it.
24. As an inbox user, I want to browse Completed items with their outcomes, so that I can check what was decided.
25. As an inbox user, I want the Completed view to show the most recently completed first, so that I can find recent decisions.
26. As an inbox user, I want the Failed view to show the most recently failed first, so that new problems surface first.
27. As an inbox user, I want sidebar counts for each view, so that I know how much work there is without opening each one.
28. As an inbox user, I want sidebar counts to stay the same when I apply filters, so that the navigation doesn't change under me.
29. As an inbox user, I want to filter by item type, so that I can work through one kind of item at a time.
30. As an inbox user, I want to filter by priority, so that I can focus on what is urgent.
31. As an inbox user, I want to search by title or requester, so that I can find a specific item.
32. As an inbox user, I want filters to be combinable and kept in the URL, so that I can share or restore what I was looking at.
33. As a screen reader user, I want the number of results announced when filters change, so that I know the effect of what I chose.
34. As an inbox user, I want a clear empty state when no items match, so that I know it is not an error and can clear the filters.
35. As an inbox user, I want to be told when someone else already handled an item I try to act on, so that I understand why my action was refused.
36. As an inbox user, I want a clear message when an item does not exist, so that I'm not left on a blank screen.
37. As an inbox user, I want items of a type the interface doesn't know yet to still appear in the list with a generic card, so that nothing is hidden by a version mismatch.
38. As an inbox user, I want fresh data when I return to the window and after each action, so that I don't act on stale information.
39. As an inbox user on a small screen, I want the list and the item details on separate pages, so that both are readable.
40. As a keyboard user, I want to reach every control in a logical order and see where focus is, so that I can use the inbox without a mouse.
41. As a keyboard user, I want a skip link past the sidebar, so that I can reach the list quickly.
42. As an assistive technology user, I want the sidebar to be a labelled navigation that marks the current view and reads each count as part of the link, so that I know where I am and how many items it holds.
43. As a user who prefers reduced motion, I want transitions kept minimal, so that the interface doesn't cause discomfort.
44. As a user who is waiting on a slow action, I want a busy indication that appears only if the wait is noticeable, so that quick actions don't flicker.
45. As an integrating system, I want to create an item through the API with validated type-specific data, so that other systems can raise work in the inbox.
46. As an integrating system, I want clear, consistently shaped errors with appropriate status codes, so that I can handle failures programmatically.
47. As a developer, I want to add a new item type with a schema, an executor and a web module registered in typed maps, so that a missing piece fails to compile.
48. As a developer, I want the server to publish events about item changes without knowing who listens, so that realtime delivery can be added later without changing the service.
49. As a developer, I want the demo data to fail deterministically, so that the failed and retry path can be demonstrated and tested reliably.
50. As a new team member, I want a README, a glossary and decision records, so that I can understand and extend the project without asking.

## Implementation Decisions

**Workspace.** A pnpm workspace with three packages: shared contracts, the API and the web app. Contracts are the single source of truth for types and runtime validation on both sides.

**Contracts.**
- Zod schemas for the item envelope (id, type, title, priority, status, outcome, requester, created date, due date, last attempt, failure reason), one extension per item type that adds a typed payload, and the item as a discriminated union on type.
- Per item type: the action names and their input schemas.
- Query parameters for listing, the counts response, the intake request, the event shapes and the problem-details error shape.
- Status values: pending, processing, completed, failed. Priority values: urgent, high, normal, low. Outcomes: approved, rejected, done, dismissed.

**State machine.**
- Pending accepts any action defined for its item type; success goes to completed with an outcome, an executor failure goes to failed.
- Failed accepts only Retry (the last attempt replayed by the server with the same action and input) or Dismiss (completed with outcome dismissed). Anything else is refused.
- Completed is terminal. Processing exists as a status and as a valid target of the machine, but the v1 executor is inline so it is never observable beyond a single request.
- Only the last attempt is stored. There is no attempt history.

**API.**
- Layers: routes, then service, then repository. Routes validate input and translate domain errors into responses. The service owns the business rules. The repository is an interface with an in-memory implementation. All wiring is in one composition root using constructor arguments and no container.
- Endpoints: list items (by view status plus filters), counts per status, get one item, create an item (intake), and submit an action on an item (including retry and dismiss).
- A failed execution responds 200 with the item in failed status (ADR 0003). Invalid input is 400, unknown item 404, an item not in a status that accepts the action 409. Errors use Problem Details and the 409 includes the item's current status.
- Sorting is fixed per view: Pending by priority then earliest due date then oldest; Failed by most recently failed; Completed by most recently completed.
- Counts are per status and ignore filters. Search matches title and requester. Filters combine with AND.
- Overdue is derived from the due date and is never stored. It applies to open items (pending and failed).

**Ports.**
- An executor port carries out an action on an item and returns success or a failure reason. v1 runs it inline. A deterministic data property on the seeded production deployment item makes its first approval fail and the retry succeed. Other types succeed.
- An event publisher port receives events (item created, item completed, item failed). v1 uses an in-process publisher with no subscribers (ADR 0001).

**Item types in v1.**
- Expense approval: approve, or reject with a required reason.
- Deployment review: approve, or request changes with a required comment.
- Documentation: submit a link, validated, with an optional note; outcome is done.
- Onboarding is deferred. The architecture is the same for every type (ADR 0002).

**Seed data.** Loaded on server start. About a dozen items spread across the three types and all views, including all four priorities, at least one overdue item, at least two failed items with reasons, a few completed items with different outcomes (including dismissed), and the deterministic failing deployment.

**Web app.**
- React with Vite, TanStack Query for server state, React Router, shadcn with Tailwind for generic components, design tokens as CSS variables so a dark theme can be added later without rework.
- Structure by feature, with a shared layer. The inbox is a standalone feature that owns its sidebar, filters, list and detail; the app shell only mounts it. A feature may import from shared; shared never imports from features; features don't import from each other. A lint rule enforces this.
- Inside the inbox: components, hooks and utilities local to the feature, and a registry of item type modules typed so every type must provide a detail view and an action form. Unknown types render a generic fallback card. Components favour composition (children and slots) over long prop lists; something moves to shared only when a second feature needs it.
- Routes: the view in the path, the item in the path, filters in the query string. The root redirects to the Pending view. On small screens list and detail are separate pages.
- Data refreshes on window focus and after every action. There is no frontend updates source in v1.

**Visual design.**
- Priority: label plus icon, colour only for urgent and high. Status uses a different visual channel from priority so they are never confused. Overdue is shown as text next to the due date. Text meets 4.5:1 contrast and icons 3:1.

**Accessibility.**
- Landmarks, a skip link, correct heading order and always-visible, labelled filters.
- The sidebar is a labelled navigation that marks the current view and includes the count in each link's accessible name.
- A live region announces result counts when filters change and the outcome of an action. Failures use an alert with a Retry control.
- After completing or dismissing an item focus moves to the next item in the list, or to the list heading when none remain, and the move is announced.
- The busy indication for an in-flight action appears only after a short delay (about 300 ms); the item moves only when the server responds, never optimistically.
- Native elements and Radix primitives through shadcn for dialogs, selects and checkboxes. Reduced motion is respected.

**Time budget.** v1 is sized for about one hour of agent-assisted work, so scope favours the core flow and accessibility essentials over extras.

## Testing Decisions

A good test exercises external behaviour through a public seam and survives internal refactors. Tests never reach into the service, repository or components directly when the seam covers the behaviour.

Two seams:

1. **The HTTP API.** Requests go through the application with the in-memory repository, the real executor and the seed data. Covers: every valid transition, failure then retry, failure then dismiss, refusal of other actions on failed and completed items (409 with the current status), validation errors (400), unknown items (404), problem-details shape, per-view sorting, filters and search, unfiltered counts, intake validation, and that events reach a subscribed fake publisher.
2. **The inbox UI.** The inbox feature is rendered with the network faked at the fetch boundary and driven like a user. Covers: switching views, the sidebar counts and their accessible names, filtering with the result count announcement, completing an item and the focus move with its announcement, the failed to Retry or Dismiss path, the conflict message, the empty state, the unknown type fallback, and an automated accessibility check on the list and detail.

There is no prior art; this is a new codebase. No end-to-end browser tests in v1.

## Out of Scope

Realtime delivery and the "new items" banner (polling or SSE), optimistic concurrency, current user and attribution, real asynchronous execution, a database, configuration of item types and saved views, dark mode, the onboarding item type, file upload, user-selectable sorting, reopening or undoing completed items, attempt history, reprioritising items, authentication, internationalisation, pagination, and end-to-end browser tests. These form the iteration 2 list and are documented in the README.

## Further Notes

- Vocabulary follows `GLOSSARY.md`: use item, action, status, outcome, view and filter exactly as defined there.
- Decisions are recorded in the ADRs: events and execution behind ports, item types as code modules, and failed actions returning 200.
- The README should cover running the project, the architecture and its boundaries, how to add an item type, and the iteration 2 list.
