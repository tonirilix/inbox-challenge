import { useRef, useState, type FormEvent } from 'react';
import { deploymentActionSchema, type DeploymentItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';
import { TextField } from './text-field';

/** Approve, or request changes with a required comment. Validation uses the shared contract schema. */
export function DeploymentActionForm({ disabled, onSubmit }: ActionFormProps<DeploymentItem>) {
  const commentRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
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
      <TextField
        label="Comment"
        hint="(required to request changes)"
        disabled={disabled}
        error={error}
        ref={commentRef}
      />
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
