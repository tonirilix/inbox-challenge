import { useId, useRef, useState, type FormEvent } from 'react';
import { deploymentActionSchema, type DeploymentItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';

/** Approve, or request changes with a required comment. Validation uses the shared contract schema. */
export function DeploymentActionForm({ disabled, onSubmit }: ActionFormProps<DeploymentItem>) {
  const commentId = useId();
  const errorId = `${commentId}-error`;
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string>();

  function requestChanges(event: FormEvent) {
    event.preventDefault();
    const parsed = deploymentActionSchema.safeParse({
      action: 'request_changes',
      input: { comment: commentRef.current?.value ?? '' },
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      commentRef.current?.focus();
      return;
    }
    setError(undefined);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={requestChanges} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={commentId} className="text-sm font-medium">
          Comment <span className="text-muted-foreground font-normal">(required to request changes)</span>
        </label>
        <textarea
          id={commentId}
          ref={commentRef}
          rows={3}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="rounded-md border p-2"
        />
        {error && (
          <p id={errorId} className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={disabled} onClick={() => onSubmit({ action: 'approve' })}>
          Approve
        </Button>
        <Button type="submit" variant="outline" disabled={disabled}>
          Request changes
        </Button>
      </div>
    </form>
  );
}
