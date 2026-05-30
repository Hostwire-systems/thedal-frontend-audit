import { useEffect, useRef, useCallback } from "react";

interface UsePersistentRefreshTimerOptions {
  /** Whether the timer is currently active (e.g. user is on the tab) */
  enabled: boolean;
  /** The refresh interval in milliseconds (default 10 minutes) */
  intervalMs: number;
  /** Unique storage key for this dashboard (e.g. dashboard_last_recompute_election) */
  storageKey: string;
  /** Optional key that triggers a reset/restart of the logic when changed (e.g. electionId) */
  activationKey?: string | number;
  /** Callback fired when recompute is due. Should return a Promise to track success. */
  onTick: () => Promise<void> | void;
  /** Callback to update the local state of 'last successful refresh' in the component */
  onTimestampUpdate: (timestamp: number) => void;
}

/**
 * A hook that manages a persistent refresh timer using localStorage.
 * It ensures recomputations only happen every N minutes across component remounts
 * and browser tabs, respecting the remaining time since the last successful refresh.
 */
export function usePersistentRefreshTimer({
  enabled,
  intervalMs,
  storageKey,
  activationKey,
  onTick,
  onTimestampUpdate,
}: UsePersistentRefreshTimerOptions) {
  const latestTickRef = useRef(onTick);
  const isTickInProgressRef = useRef(false);

  useEffect(() => {
    latestTickRef.current = onTick;
  }, [onTick]);

  const executeTick = useCallback(async () => {
    if (isTickInProgressRef.current) return;
    
    try {
      isTickInProgressRef.current = true;
      await latestTickRef.current();
      
      // Only update timestamp on success
      const now = Date.now();
      try {
        localStorage.setItem(storageKey, now.toString());
      } catch (e) {
        console.warn("localStorage not available for persistent timer", e);
      }
      onTimestampUpdate(now);
    } catch (error) {
      console.error(`Persistent refresh failed for ${storageKey}:`, error);
    } finally {
      isTickInProgressRef.current = false;
    }
  }, [storageKey, onTimestampUpdate]);

  useEffect(() => {
    if (!enabled) return;

    let timerId: number | null = null;
    let intervalId: number | null = null;

    const scheduleNext = () => {
      let lastRecompute = 0;
      try {
        const stored = localStorage.getItem(storageKey);
        lastRecompute = stored ? parseInt(stored, 10) : 0;
      } catch (e) {
        // Fallback to 0 (trigger immediately) if localStorage fails
      }

      const now = Date.now();
      const timeSinceLast = now - lastRecompute;
      const remainingTime = Math.max(0, intervalMs - timeSinceLast);

      // Initial timeout for the remaining time
      timerId = window.setTimeout(async () => {
        await executeTick();

        // After first successful tick (or skip), start regular interval
        intervalId = window.setInterval(executeTick, intervalMs);
      }, remainingTime);
    };

    scheduleNext();

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, storageKey, activationKey, executeTick]);
}
