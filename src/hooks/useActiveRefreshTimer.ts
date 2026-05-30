import { useEffect, useRef } from "react";

interface UseActiveRefreshTimerOptions {
  enabled: boolean;
  intervalMs: number;
  activationKey?: string | number;
  onTick: () => void | Promise<void>;
}

export function useActiveRefreshTimer({
  enabled,
  intervalMs,
  activationKey,
  onTick,
}: UseActiveRefreshTimerOptions) {
  const latestTickRef = useRef(onTick);

  useEffect(() => {
    latestTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let intervalId: number | null = null;

    const timeoutId = window.setTimeout(() => {
      void latestTickRef.current();

      intervalId = window.setInterval(() => {
        void latestTickRef.current();
      }, intervalMs);
    }, intervalMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [enabled, intervalMs, activationKey]);
}