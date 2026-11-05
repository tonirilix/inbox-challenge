# Workflow Inbox

An internal operations inbox where people review and act on pending work raised by other systems: approving expenses, reviewing deployments, completing onboarding, and so on.

## Language

### Work

**Item**:
A unit of work waiting for a person in the inbox, such as "Approve Acme travel expense".
_Avoid_: Task, ticket, request, action

**Item type**:
The kind of item, which determines what information it carries and which actions are possible.
_Avoid_: Category, kind

**Requester**:
The person or system that raised an item, shown by display name.
_Avoid_: Author, creator, owner

**Priority**:
How urgently an item needs attention: urgent, high, normal or low. Set by the requester and read-only for the inbox user.
_Avoid_: Severity, importance

**Due date**:
The date by which an item should be handled. An open item past its due date is **overdue**, which is derived and never stored.
_Avoid_: Deadline, SLA

### Handling an item

**Action**:
A choice a user makes on an item, such as Approve, Reject or Request changes.
_Avoid_: Command, operation, task

**Status**:
Where an item is in its lifecycle: pending, processing, completed or failed.
_Avoid_: State, stage

**Outcome**:
The decision recorded on a completed item, such as approved, rejected, done or dismissed. A rejection is an outcome of a completed item, not a failure.
_Avoid_: Result, resolution

**Failed**:
A status meaning the user's action was accepted but the system could not carry it out.
_Avoid_: Errored, rejected

**Attempt**:
The action and input a user submitted on an item. Only the last attempt is kept.
_Avoid_: Submission, try

**Retry**:
Running the last attempt of a failed item again, with the same action and input.
_Avoid_: Redo, resubmit

**Dismiss**:
Closing a failed item without retrying it. The item becomes completed with the outcome dismissed.
_Avoid_: Ignore, cancel, archive

### Finding items

**View**:
A named, predefined status selection shown in the sidebar: Pending, Failed or Completed. Views are mutually exclusive.
_Avoid_: Tab, folder, list

**Filter**:
A narrowing within the current view by item type, priority or search text. Filters combine.
_Avoid_: Facet, refinement

### Reacting to change

**Event**:
A record that something happened to an item, published so other parts of the system can react to it.
_Avoid_: Notification, message
