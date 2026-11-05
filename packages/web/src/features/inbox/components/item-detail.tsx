import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { itemSchema, type ActionRequest, type Item, type ItemEnvelope } from '@inbox/contracts';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { useItem } from '../hooks/use-items';
import { useDelayedFlag } from '@/shared/a11y/use-delayed-flag';
import { useSubmitAction } from '../hooks/use-submit-action';
import { isKnownItemType, itemTypeLabel, itemTypeModules, type ActionFormProps } from '../item-types';
import { useCurrentView } from '../hooks/use-current-view';
import { capitalize, formatDate } from '../utils/format';
import { daysOverdue, overdueText } from '../utils/overdue';

function BackToList() {
  const view = useCurrentView();
  const { search } = useLocation();
  return (
    <Link to={`/${view}${search}`} className="text-sm underline">
      Back to list
    </Link>
  );
}

/** Common envelope fields around whatever the item type adds (children). */
function ItemFrame({
  item,
  busy = false,
  children,
}: {
  item: ItemEnvelope;
  busy?: boolean;
  children?: ReactNode;
}) {
  const overdue = daysOverdue(item);
  return (
    <section
      aria-labelledby="item-title"
      aria-busy={busy}
      className="flex flex-col gap-4 rounded-md border p-4"
    >
      <BackToList />
      <div>
        <h2 id="item-title" className="text-lg font-semibold">
          {item.title}
        </h2>
        <p className="text-muted-foreground text-sm">{itemTypeLabel(item.type)}</p>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Requester</dt>
        <dd>{item.requester}</dd>
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{item.priority}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{capitalize(item.status)}</dd>
        {item.outcome && (
          <>
            <dt className="text-muted-foreground">Outcome</dt>
            <dd>{capitalize(item.outcome)}</dd>
          </>
        )}
        {item.dueDate && (
          <>
            <dt className="text-muted-foreground">Due</dt>
            <dd>
              {formatDate(item.dueDate)}
              {overdue > 0 && (
                <span className="text-destructive ml-2 font-medium">{overdueText(overdue)}</span>
              )}
            </dd>
          </>
        )}
      </dl>
      {children}
    </section>
  );
}

/** Why a failed item failed and the two ways out: replay the last attempt, or close it. */
function FailedPanel({
  item,
  disabled,
  onSubmit,
}: {
  item: ItemEnvelope;
  disabled: boolean;
  onSubmit: (request: ActionRequest) => void;
}) {
  const attempt = item.lastAttempt;
  const details = attempt ? Object.values(attempt.input).map(String).join('; ') : '';
  return (
    <div className="flex flex-col gap-3">
      <div className="border-destructive rounded-md border p-3">
        <p className="font-medium">This item failed: {item.failureReason}</p>
        {attempt && (
          <p className="text-sm">
            Last attempt: {attempt.action.replace('_', ' ')}
            {details && ` (${details})`}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button disabled={disabled} onClick={() => onSubmit({ action: 'retry' })}>
          Retry
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => onSubmit({ action: 'dismiss' })}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/** Detail and, while pending, the action form of a known item type. */
function KnownItemDetail({ item }: { item: Item }) {
  const view = useCurrentView();
  const submit = useSubmitAction(item, view);
  // Busy appears only after a noticeable wait; the form is locked from the start.
  const busy = useDelayedFlag(submit.isPending);
  // Correlating the item with its own module cannot be expressed by the type system.
  const { Detail, ActionForm } = itemTypeModules[item.type] as unknown as {
    Detail: ComponentType<{ item: Item }>;
    ActionForm: ComponentType<ActionFormProps>;
  };

  return (
    <ItemFrame item={item} busy={busy}>
      <Detail item={item} />
      {submit.error && (
        <div role="alert">
          {submit.error instanceof ApiError && submit.error.status === 409
            ? 'This item was already handled, so your action was not applied. It has been refreshed.'
            : 'The action could not be submitted. Try again.'}
        </div>
      )}
      {busy && <p>Working…</p>}
      {item.status === 'failed' && (
        <FailedPanel item={item} disabled={submit.isPending} onSubmit={(request) => submit.mutate(request)} />
      )}
      {item.status === 'pending' && (
        <ActionForm item={item} disabled={submit.isPending} onSubmit={(request) => submit.mutate(request)} />
      )}
    </ItemFrame>
  );
}

export function ItemDetail({ itemId }: { itemId: string }) {
  const { data: envelope, error, isPending, refetch } = useItem(itemId);

  if (isPending) return <p role="status">Loading item…</p>;

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <section aria-labelledby="item-title" className="flex flex-col gap-2">
          <h2 id="item-title" className="text-lg font-semibold">
            Item not found
          </h2>
          <p>This item does not exist or is no longer available.</p>
          <BackToList />
        </section>
      );
    }
    return (
      <div role="alert" className="flex items-center gap-3">
        <p>The item could not be loaded.</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const known = isKnownItemType(envelope.type) ? itemSchema.safeParse(envelope) : undefined;
  if (known?.success) {
    return <KnownItemDetail item={known.data} />;
  }

  return (
    <ItemFrame item={envelope}>
      <p>Items of type “{envelope.type}” are not supported by this version of the app.</p>
    </ItemFrame>
  );
}
