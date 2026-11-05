# 05: Failure, retry and dismiss

**What to build:** Deployment review items can be approved or sent back for changes. Approving the seeded production deployment fails the first time, lands in the Failed view with its reason, and can be retried successfully or dismissed.

**Blocked by:** 04

**Status:** resolved

- [ ] The deployment review type exists across contracts, executor and web: approve, or request changes with a required comment
- [ ] The executor fails deterministically on the first approval of the seeded production deployment and succeeds on retry; no randomness
- [ ] A failed execution responds 200 with the item in failed status, its failure reason and its last attempt (ADR 0003)
- [ ] The Failed view lists failed items and its count is prominent in the sidebar
- [ ] The detail of a failed item shows the reason and last attempt in an alert, with Retry and Dismiss controls
- [ ] Retry replays the last attempt with the same action and input; success completes the item with the original outcome
- [ ] Dismiss completes the item with outcome dismissed and it appears in Completed
- [ ] Any action other than Retry or Dismiss on a failed item returns 409, as does any action on a completed item
- [ ] Focus and announcements after Retry or Dismiss behave as in completing an item
- [ ] API tests cover failure, retry, dismiss and the refusals; a UI test covers the failed to retry and failed to dismiss paths
