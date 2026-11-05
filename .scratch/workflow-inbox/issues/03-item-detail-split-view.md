# 03: Item detail in a split view

**What to build:** Selecting an item opens its details beside the list. The item has its own URL, so it can be shared and the back button works. On small screens the list and the details are separate pages. Item types render through a typed registry and unknown types still show up.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The API returns one item by id, and responds 404 as Problem Details for an unknown id
- [ ] Selecting an item navigates to its URL; opening the URL directly shows the same split view
- [ ] A registry maps each item type to its detail view, typed so a missing entry fails to compile; the expense type provides its detail
- [ ] An item whose type the web app doesn't know renders a generic fallback card in the list and detail
- [ ] A not-found state is shown for a missing item, with a way back to the list
- [ ] On small screens list and detail are separate pages with working back navigation
- [ ] The selected row is indicated programmatically as well as visually, and the detail is reachable by keyboard in a logical order
- [ ] UI tests cover opening an item, the not-found state and the unknown type fallback
