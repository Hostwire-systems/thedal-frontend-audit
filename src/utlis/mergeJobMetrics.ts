export interface MergeResultStats {
  updatedEpicSample?: string[];
  missingEpicInTargetCount?: number;
  unmodifiedMatchedVoters?: number;
  durationSeconds?: number;
  totalSourceVoters?: number;
  fieldUpdateCounts?: Record<string, number>;
  matchedVoters?: number;
  updatedVoters?: number;
}

export function parseResultStats(raw: string | null | undefined): MergeResultStats | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed as MergeResultStats;
  } catch (e) {
    // If backend ever sends non-JSON text, fail gracefully
    return null;
  }
}

export function computeUpdatesPercent(stats: MergeResultStats | null | undefined): number {
  if (!stats) return 0;
  const matched = stats.matchedVoters ?? 0;
  const updated = stats.updatedVoters ?? 0;
  if (matched <= 0) return 0;
  return Math.round((updated / matched) * 100);
}

export function sumFieldUpdateCounts(stats: MergeResultStats | null | undefined): number {
  if (!stats || !stats.fieldUpdateCounts) return 0;
  return Object.values(stats.fieldUpdateCounts).reduce((a, b) => a + (b || 0), 0);
}
