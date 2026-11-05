# 08: Item intake and events

**What to build:** Other systems can raise an item through the API, with validation specific to the item type. The service publishes events about item changes, which proves the seam realtime will use later.

**Blocked by:** 05, 06

**Status:** resolved

- [ ] The intake endpoint creates a pending item, validated against the contract of its type, and returns 201 with the item
- [ ] An invalid or unknown type, or a payload that doesn't match the type, returns 400 as Problem Details
- [ ] The service publishes an event when an item is created, completed or failed
- [ ] A new item shows up in the inbox after the next refetch
- [ ] API tests cover intake for every type, its validation errors and the events received by a fake publisher
