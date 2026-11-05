import { useRef, useState, type FormEvent } from 'react';
import { expenseActionSchema, type ExpenseItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';
import { TextField } from './text-field';

/** Approve, or reject with a required reason. Validation uses the shared contract schema. */
export function ExpenseActionForm({ disabled, onSubmit }: ActionFormProps<ExpenseItem>) {
  const reasonRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
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
      <TextField
        label="Reason"
        hint="(required to reject)"
        disabled={disabled}
        error={error}
        ref={reasonRef}
      />
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
