# A failed action returns 200 with a failed item

Submitting an action whose execution fails responds `200` with the item in `failed` status and its last attempt, not a `5xx`. The request itself succeeded; it is the business operation that failed, and that is recorded as state the user can retry or dismiss. `5xx` is reserved for bugs in the service, and clients and proxies treat it as safe to repeat the same request.

Errors that reject the request (invalid input, unknown item, item not in a status that accepts the action) use Problem Details responses with `400`, `404` and `409`.
