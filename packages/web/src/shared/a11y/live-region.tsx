import type { ReactNode } from 'react';

/**
 * A polite live region. Keep it mounted and change only its content, so
 * screen readers announce the update. It stays visible; `label` names it.
 */
export function LiveRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p role="status" aria-live="polite" aria-label={label} className={className}>
      {children}
    </p>
  );
}
