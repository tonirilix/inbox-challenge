import { useId, useRef, useState, type FormEvent } from 'react';
import { expenseActionSchema, type ExpenseItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';

/** Approve, or reject with a required reason. Validation uses the shared contract schema. */
export function ExpenseActionForm({ disabled, onSubmit }: ActionFormProps<ExpenseItem>) {
  const reasonId = useId();
  const errorId = `${reasonId}-error`;
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string>();

  function reject(event: FormEvent) {
    event.preventDefault();
    const parsed = expenseActionSchema.safeParse({
      action: 'reject',
      input: { reason: reasonRef.current?.value ?? '' },
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      reasonRef.current?.focus();
      return;
    }
    setError(undefined);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={reject} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={reasonId} className="text-sm font-medium">
          Reason <span className="text-muted-foreground font-normal">(required to reject)</span>
        </label>
        <textarea
          id={reasonId}
          ref={reasonRef}
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
          Reject
        </Button>
      </div>
    </form>
  );
}
