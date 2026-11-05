import { useEffect, useState } from 'react';

/** True only once `active` has been true for `delayMs`, so quick work never flickers. */
export function useDelayedFlag(active: boolean, delayMs = 300) {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, delayMs]);
  return active && elapsed;
}
