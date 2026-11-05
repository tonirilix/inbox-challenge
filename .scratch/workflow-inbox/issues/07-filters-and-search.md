# 07: Filters and search

**What to build:** Within a view the user can narrow items by type, priority and a search text. Filters combine, live in the URL and announce how many results match. An empty result is explained and easy to clear.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The list endpoint accepts type, priority and search filters that combine with AND; search matches title and requester
- [ ] Filters are always visible, individually labelled controls and are reflected in the URL query, so a shared link restores them
- [ ] A polite live region announces the number of results when filters change
- [ ] When nothing matches, an empty state says so and offers a control to clear the filters
- [ ] Sidebar counts stay the same regardless of filters
- [ ] Invalid filter values return 400 as Problem Details
- [ ] API tests cover filter combinations and counts; a UI test covers filtering, the announcement and the empty state
