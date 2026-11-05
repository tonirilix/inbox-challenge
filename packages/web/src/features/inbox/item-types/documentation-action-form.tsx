import { useId, useRef, useState, type FormEvent } from 'react';
import { documentationActionSchema, type DocumentationItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';

/** Submit a link with an optional note. Validation uses the shared contract schema. */
export function DocumentationActionForm({ disabled, onSubmit }: ActionFormProps<DocumentationItem>) {
  const id = useId();
  const errorId = `${id}-error`;
  const linkRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const note = noteRef.current?.value.trim();
    const parsed = documentationActionSchema.safeParse({
      action: 'submit',
      input: { link: linkRef.current?.value ?? '', ...(note ? { note } : {}) },
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      linkRef.current?.focus();
      return;
    }
    setError(undefined);
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-link`} className="text-sm font-medium">
          Link <span className="text-muted-foreground font-normal">(required)</span>
        </label>
        <input
          id={`${id}-link`}
          ref={linkRef}
          type="text"
          inputMode="url"
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
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-note`} className="text-sm font-medium">
          Note <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea id={`${id}-note`} ref={noteRef} rows={3} disabled={disabled} className="rounded-md border p-2" />
      </div>
      <div>
        <Button type="submit" disabled={disabled}>
          Submit link
        </Button>
      </div>
    </form>
  );
}
