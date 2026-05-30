/**
 * Family Stats Cache
 * to enable prefetching on dashboard and instant display on FamilyDetail page
 */

import { PartFamilyStats } from "../types/family";

interface CachedFamilyStats {
  electionId: string;
  partStats: PartFamilyStats[];
  timestamp: number;
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

let cachedData: CachedFamilyStats | null = null;
let fetchPromise: Promise<PartFamilyStats[]> | null = null;

/**
 * Get cached family stats if available and not expired
 */
export const getCachedFamilyStats = (electionId: string): PartFamilyStats[] | null => {
  if (!cachedData) return null;
  if (cachedData.electionId !== electionId) return null;
  if (Date.now() - cachedData.timestamp > CACHE_EXPIRATION_MS) {
    cachedData = null;
    return null;
  }
  return cachedData.partStats;
};

/**
 * Set family stats in cache
 */
export const setCachedFamilyStats = (
  electionId: string,
  partStats: PartFamilyStats[]
): void => {
  cachedData = {
    electionId,
    partStats,
    timestamp: Date.now(),
  };
};

/**
 * Clear the cache
 */
export const clearFamilyStatsCache = (): void => {
  cachedData = null;
  fetchPromise = null;
};

/**
 * Check if there's an ongoing fetch
 */
export const getFetchPromise = (): Promise<PartFamilyStats[]> | null => fetchPromise;

/**
 * Set the ongoing fetch promise (to prevent duplicate fetches)
 */
export const setFetchPromise = (promise: Promise<PartFamilyStats[]> | null): void => {
  fetchPromise = promise;
};

/**
 * Check if cache is valid for the given election
 */
export const isCacheValid = (electionId: string): boolean => {
  if (!cachedData) return false;
  if (cachedData.electionId !== electionId) return false;
  return Date.now() - cachedData.timestamp <= CACHE_EXPIRATION_MS;
};
