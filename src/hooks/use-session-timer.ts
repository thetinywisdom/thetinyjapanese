import { useEffect, useState } from "react";
import { formatElapsed } from "@/lib/elapsed";

/**
 * Elapsed time for an in-progress practice session.
 * The start instant and the displayed "now" are captured together, so the
 * first paint cannot show a negative clock (`-1:-1`) while waiting for the
 * next interval tick.
 */
export function useSessionTimer(active: boolean): string {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (active && startTime === null) {
      const t = Date.now();
      setStartTime(t);
      setNow(t);
    }
    if (!active && startTime !== null) {
      setStartTime(null);
    }
  }, [active, startTime]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (startTime === null) return formatElapsed(0);
  return formatElapsed(now - startTime);
}
