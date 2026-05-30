/**
 * useFamilyStats Hook
 * Prefetches and caches family statistics for quick loading on FamilyDetail page
 */

import { useCallback, useEffect, useRef } from "react";
import { getFamilyPartStats } from "../api/familyApi";
import { PartFamilyStats } from "../types/family";
import {
  getCachedFamilyStats,
  setCachedFamilyStats,
  isCacheValid,
  getFetchPromise,
  setFetchPromise,
} from "../services/familyStatsCache";

interface UseFamilyStatsOptions {
  /** If true, fetches data immediately. Default: true */
  prefetch?: boolean;
}

interface UseFamilyStatsReturn {
  /** Manually trigger prefetch */
  prefetchStats: () => Promise<PartFamilyStats[]>;
  /** Check if data is cached */
  isCached: boolean;
}

/**
 * Hook to prefetch family statistics data
 * Call this on the dashboard to preload data before user navigates to FamilyDetail
 */
export const useFamilyStatsPrefetch = (
  electionId: string | number | null,
  options: UseFamilyStatsOptions = {}
): UseFamilyStatsReturn => {
  const { prefetch = true } = options;
  const electionIdStr = electionId?.toString() || "";
  const isFetchingRef = useRef(false);

  const fetchFamilyStats = useCallback(async (): Promise<PartFamilyStats[]> => {
    if (!electionIdStr) return [];

    // Check if already cached
    if (isCacheValid(electionIdStr)) {
      return getCachedFamilyStats(electionIdStr) || [];
    }

    // Check if there's already an ongoing fetch
    const existingPromise = getFetchPromise();
    if (existingPromise) {
      return existingPromise;
    }

    // Prevent duplicate fetches
    if (isFetchingRef.current) return [];
    isFetchingRef.current = true;

    const fetchPromise = (async () => {
      try {
        const validStats = await getFamilyPartStats(parseInt(electionIdStr));

        // Cache the results
        setCachedFamilyStats(electionIdStr, validStats);

        return validStats;
      } catch (error) {
        console.error("Error prefetching family stats:", error);
        return [];
      } finally {
        isFetchingRef.current = false;
        setFetchPromise(null);
      }
    })();

    setFetchPromise(fetchPromise);
    return fetchPromise;
  }, [electionIdStr]);

  // Auto-prefetch on mount if enabled
  useEffect(() => {
    if (prefetch && electionIdStr && !isCacheValid(electionIdStr)) {
      fetchFamilyStats();
    }
  }, [prefetch, electionIdStr, fetchFamilyStats]);

  return {
    prefetchStats: fetchFamilyStats,
    isCached: isCacheValid(electionIdStr),
  };
};

export default useFamilyStatsPrefetch;
