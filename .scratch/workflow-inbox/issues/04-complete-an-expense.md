# 04: Complete an expense (the state machine)

**What to build:** The user can approve an expense or reject it with a required reason. The item leaves Pending, appears in Completed with its outcome, and focus moves to the next item with the result announced. This ticket introduces the state machine and the two ports from ADR 0001.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] The actions endpoint accepts an action and its input for a pending item and returns the updated item
- [ ] An executor port carries out actions (inline in v1) and an event publisher port receives events; the service depends only on the ports
- [ ] Approving completes the item with outcome approved; rejecting requires a reason and completes with outcome rejected
- [ ] Invalid input returns 400, an unknown item 404, and an action on an item that no longer accepts it 409 including its current status, all as Problem Details
- [ ] The action form shows validation errors next to the fields
- [ ] The item moves only when the server responds; the busy state appears only after about 300 ms and the detail is marked busy meanwhile
- [ ] After completing, focus moves to the next item in the list (or the list heading when none remain) and a live region announces the outcome and the next item
- [ ] A 409 shows a clear message that the item was already handled and refreshes the data
- [ ] API tests cover every transition and error; a UI test covers completion, focus and announcement, and the conflict message
