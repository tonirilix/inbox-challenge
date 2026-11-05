# 01: Walking skeleton: workspace to a visible list

**What to build:** A pnpm workspace with shared contracts, an API and a web app, wired end to end. The inbox shows a handful of seeded expense items fetched from the API, inside an accessible app shell. This is the base every other ticket builds on, so it also sets up the tooling.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] Contracts define the item envelope and the expense item type with Zod; API and web both import types from them
- [ ] The API has routes, service and repository layers with an in-memory repository, wired in one composition root, and serves a list of items
- [ ] A few expense items are seeded when the server starts
- [ ] The web app lists the seeded items using TanStack Query, with shadcn and Tailwind configured and design tokens as CSS variables
- [ ] The shell has landmarks, a skip link past the sidebar, and a sensible heading order
- [ ] Data refetches when the window regains focus
- [ ] Test runners for both seams are configured and one passing test exists for each (an API request, a rendered inbox with the network faked)
- [ ] Lint enforces the import boundaries: features may import shared, shared never imports features, features never import each other
- [ ] One command starts API and web together; a one-line note in the README says how
