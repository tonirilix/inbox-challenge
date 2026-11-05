# 06: Documentation type

**What to build:** The user can complete a documentation item by submitting a link and an optional note. It is the third item type and shows that adding a type is a contract, an executor and a web module.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] The documentation type exists across contracts, executor and web, registered in the same typed maps
- [ ] Submitting a valid link with an optional note completes the item with outcome done
- [ ] A missing or malformed link is rejected with 400 and explained next to the field
- [ ] The seed data includes documentation items in different views
- [ ] API and UI tests cover the success and validation paths
