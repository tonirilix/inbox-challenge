import { useId, type ReactNode, type RefObject } from 'react';

interface TextFieldProps {
  label: string;
  /** Shown after the label, e.g. "(required)". */
  hint: string;
  disabled: boolean;
  /** Validation message; also marks the field invalid and is linked with aria-describedby. */
  error?: string;
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** A single-line URL input instead of a textarea. */
  url?: boolean;
}

/** A labelled text field with an inline error, shared by the item types' action forms. */
export function TextField({ label, hint, disabled, error, ref, url }: TextFieldProps): ReactNode {
  const id = useId();
  const errorId = `${id}-error`;
  const common = {
    id,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: 'rounded-md border p-2',
  } as const;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label} <span className="text-muted-foreground font-normal">{hint}</span>
      </label>
      {url ? (
        <input {...common} ref={ref as RefObject<HTMLInputElement>} type="text" inputMode="url" />
      ) : (
        <textarea {...common} ref={ref as RefObject<HTMLTextAreaElement>} rows={3} />
      )}
      {error && (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
