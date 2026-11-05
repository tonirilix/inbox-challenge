import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => undefined);

/** Renders the page's single polite live region; `useAnnounce` writes to it. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  // Clearing first makes a repeated identical message announce again.
  const announce = useCallback<Announce>((next) => {
    setMessage('');
    setTimeout(() => setMessage(next), 50);
  }, []);
  const value = useMemo(() => announce, [announce]);

  return (
    <AnnouncerContext value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>
    </AnnouncerContext>
  );
}

export const useAnnounce = () => useContext(AnnouncerContext);
