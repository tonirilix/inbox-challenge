# 02: Views, counts and ordering

**What to build:** The user can switch between the Pending, Failed and Completed views in the sidebar, see how many items each holds, and find items ordered so the top is what to do next. Priority and overdue state are visible in the list.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The list endpoint returns the items of one view by status, ordered per view: Pending by priority then earliest due date then oldest; Failed by most recently failed; Completed by most recently completed
- [ ] A counts endpoint returns the number of items per status and ignores any filters
- [ ] The sidebar is a labelled navigation that marks the current view and includes the count in each link's accessible name; the Failed count is visually prominent
- [ ] The view is part of the URL path and the root redirects to Pending
- [ ] The seed data covers every status, all four priorities, at least one overdue item and completed items with different outcomes
- [ ] Each list row shows type, title, requester, priority and due date; priority uses a label and an icon, with colour only for urgent and high, and a different visual channel from status
- [ ] Overdue open items show how late they are as text
- [ ] API tests cover ordering per view and counts; a UI test covers switching views and the accessible names
