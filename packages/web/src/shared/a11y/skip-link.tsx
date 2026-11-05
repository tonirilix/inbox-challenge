import type { ReactNode } from 'react';
import { MAIN_CONTENT_ID } from './main-content';

/** First focusable element on the page; hidden until focused. */
export function SkipLink({ children }: { children: ReactNode }) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="bg-background text-foreground sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
    >
      {children}
    </a>
  );
}
