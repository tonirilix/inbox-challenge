# Events and action execution sit behind ports

The service publishes events through an event publisher port and carries out actions through an executor port, and neither knows how events reach clients or whether execution is synchronous. In v1 the executor runs inline and nothing consumes the events, so realtime delivery (polling or SSE), a worker-based executor and the `processing` status can arrive in iteration 2 without changing the service or the UI contract.

## Consequences

The server has the seam in v1 but the frontend does not: the UI refetches on window focus and after each action, and the updates-source interface is introduced together with the first realtime transport.
