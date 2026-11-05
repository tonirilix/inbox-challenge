import { useRef, useState, type FormEvent } from 'react';
import { documentationActionSchema, type DocumentationItem } from '@inbox/contracts';
import { Button } from '@/shared/ui/button';
import type { ActionFormProps } from './index';
import { TextField } from './text-field';

/** Submit a link with an optional note. Validation uses the shared contract schema. */
export function DocumentationActionForm({ disabled, onSubmit }: ActionFormProps<DocumentationItem>) {
  const linkRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
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
      <TextField label="Link" hint="(required)" disabled={disabled} error={error} ref={linkRef} url />
      <TextField label="Note" hint="(optional)" disabled={disabled} ref={noteRef} />
      <div>
        <Button type="submit" disabled={disabled}>
          Submit link
        </Button>
      </div>
    </form>
  );
}
