import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getElectionStats,
  recomputeElectionStats,
  getDemographics,
  recomputeDemographics,
  getPartyPolling,
  recomputePartyPolling,
  getFeedbackIssues,
  recomputeFeedbackIssues,
  getBoothProgress,
  recomputeBoothProgress,
  getContactStatus,
  recomputeContactStatus,
  getCadreDashboard,
  recomputeCadreDashboard,
  getPollDayHourly,
  recomputePollDayHourly,
  getPollDayAgeGroups,
  recomputePollDayAgeGroups,
  getPollDayWardAgeGroups,
  recomputePollDayWardAgeGroups,
  getPollDayBoothSummary,
  recomputePollDayBoothSummary,
  getPollDayPartWisePolling,
  recomputePollDayPartWisePolling,
  getPollDayFamilyWisePolling,
  recomputePollDayFamilyWisePolling,
  safeParseMap,
  type ElectionStatsAggregate,
  type DemographicsAggregate,
  type PartyPollingAggregate,
  type FeedbackIssuesAggregate,
  type BoothProgressAggregate,
  type ContactStatusAggregate,
  type CadreDashboardAggregate,
  type PollDayHourlyAggregate,
  type PollDayAgeGroupsAggregate,
  type PollDayWardAgeGroupsAggregate,
  type PollDayBoothSummaryAggregate,
  PollDayPartWisePollingAggregate,
  PollDayFamilyWisePollingAggregate,
} from '../api/reportingApi';
import { getVoterCountBySectionApi, VoterCountBySectionResponse } from '../api/sectionApi';

// Generic slice hook
interface SliceState<T> { loading: boolean; error?: string; data?: T; etag?: string; notModified?: boolean; recomputing?: boolean; }
type SlicePollMode = 'load' | 'recompute';

// Generic slice hook now also supports recompute function (optional)
function useSlice<T>(
  fetcher: (ifNoneMatch?: string) => Promise<T & { _etag?: string; _notModified?: boolean; }> ,
  deps: any[] = [],
  pollIntervalMs?: number,
  recomputeFn?: () => Promise<any>,
  pollMode: SlicePollMode = 'load'
) {
  const [state, setState] = useState<SliceState<T>>({ loading: false });
  const timerRef = useRef<number | null>(null);
  const etagRef = useRef<string | undefined>(undefined);

  // Update etagRef whenever state changes
  useEffect(() => {
    etagRef.current = state.etag;
  }, [state.etag]);

  const load = useCallback(async (ifNoneMatch?: string) => {
    setState(s => ({ ...s, loading: true, error: undefined }));
    try {
      const res: any = await fetcher(ifNoneMatch);
      if (res._notModified) {
        setState(s => ({ ...s, loading: false, notModified: true }));
      } else {
        const { _etag, _notModified, ...rest } = res;
        setState({ loading: false, data: rest as T, etag: _etag, notModified: !!_notModified });
      }
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e?.response?.data?.message || e.message || 'Error' }));
    }
  }, [fetcher]);

  const recompute = useCallback(async () => {
    if (!recomputeFn) return;
    setState(s => ({ ...s, recomputing: true, loading: true }));
    try {
      // Recompute server-side first, then fetch a fresh snapshot so UI state
      // does not depend on the recompute response payload shape.
      await recomputeFn();
      await load();
      setState(s => ({ ...s, recomputing: false }));
    } catch (e) {
      setState(s => ({ ...s, recomputing: false, loading: false }));
      throw e;
    }
  }, [recomputeFn, load]);

  const reload = useCallback(() => load(), [load]);
  const softReload = useCallback(() => load(etagRef.current), [load]);

  useEffect(() => {
    // Skip loading if the first dependency (typically electionId) is invalid
    // This prevents API calls when there's no valid election selected
    // But allows undefined in other positions (like optional filters parameter)
    const firstDep = deps[0];
    const hasInvalidElectionId = firstDep === undefined || firstDep === null || firstDep === 0 || firstDep === '';
    
    if (hasInvalidElectionId) {
      setState({ loading: false, data: undefined });
      return;
    }

    load();
    if (pollIntervalMs) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        if (pollMode === 'recompute' && recomputeFn) {
          void recompute().catch(() => undefined);
        } else {
          void load(etagRef.current); // Use ref to avoid stale closure
        }
      }, pollIntervalMs);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pollIntervalMs]);

  return { ...state, reload, softReload, recompute } as const;
}


export interface PollDaySectionData {
  sectionNo: number;
  sectionNameEn: string;
  sectionNameL1?: string;
  voterCount: number;
}

export interface PollDaySectionWiseAggregate {
  partNo: number;
  sections: PollDaySectionData[];
}

export function useElectionStats(electionId: number | undefined, partNumbers?: number[], refreshInterval?: number) {
  const partNumbersKey = partNumbers ? JSON.stringify(partNumbers) : undefined;
  return useSlice<ElectionStatsAggregate>(
    (ifNone) => getElectionStats(electionId!, ifNone, partNumbers),
    [electionId, partNumbersKey], refreshInterval, electionId ? () => recomputeElectionStats(electionId!, partNumbers) : undefined
  );
}

export function useDemographics(electionId: number | undefined, partNumbers?: number[], refreshInterval?: number) {
  const partNumbersKey = partNumbers ? JSON.stringify(partNumbers) : undefined;
  return useSlice<DemographicsAggregate>(
    (ifNone) => getDemographics(electionId!, ifNone, partNumbers),
    [electionId, partNumbersKey], refreshInterval, electionId ? () => recomputeDemographics(electionId!, partNumbers) : undefined
  );
}

export function usePartyPolling(electionId: number | undefined, partNumbers?: number[], refreshInterval?: number) {
  const partNumbersKey = partNumbers ? JSON.stringify(partNumbers) : undefined;
  return useSlice<PartyPollingAggregate>(
    (ifNone) => getPartyPolling(electionId!, ifNone, partNumbers),
    [electionId, partNumbersKey], refreshInterval, electionId ? () => recomputePartyPolling(electionId!, partNumbers) : undefined
  );
}

export function useFeedbackIssues(electionId: number | undefined, refreshInterval?: number) {
  return useSlice<FeedbackIssuesAggregate>(
    (ifNone) => getFeedbackIssues(electionId!, ifNone),
    [electionId], refreshInterval, electionId ? () => recomputeFeedbackIssues(electionId!) : undefined
  );
}

export function useBoothProgress(electionId: number | undefined, refreshInterval?: number) {
  return useSlice<BoothProgressAggregate>(
    (ifNone) => getBoothProgress(electionId!, ifNone),
    [electionId], refreshInterval, electionId ? () => recomputeBoothProgress(electionId!) : undefined
  );
}

export function useContactStatus(electionId: number | undefined, refreshInterval: number = 30000) {
  return useSlice<ContactStatusAggregate>(
    (ifNone) => getContactStatus(electionId!, ifNone),
    [electionId], refreshInterval, electionId ? () => recomputeContactStatus(electionId!) : undefined
  );
}

export function useCadreDashboard(electionId: number | undefined, refreshInterval?: number) {
  return useSlice<CadreDashboardAggregate>(
    (ifNone) => getCadreDashboard(electionId!, ifNone),
    [electionId], refreshInterval, electionId ? () => recomputeCadreDashboard(electionId!) : undefined
  );
}

export function usePollDayHourly(electionId: number | undefined, pollingDate?: string, refreshInterval: number = 30000) {
  return useSlice<PollDayHourlyAggregate>(
    (ifNone) => getPollDayHourly(electionId!, pollingDate, ifNone),
    [electionId, pollingDate], refreshInterval, electionId ? () => recomputePollDayHourly(electionId!, pollingDate) : undefined
  );
}

export function usePollDayAgeGroups(electionId: number | undefined, pollingDate?: string, refreshInterval: number = 30000) {
  return useSlice<PollDayAgeGroupsAggregate>(
    (ifNone) => getPollDayAgeGroups(electionId!, pollingDate, ifNone),
    [electionId, pollingDate], refreshInterval, electionId ? () => recomputePollDayAgeGroups(electionId!, pollingDate) : undefined
  );
}

export function usePollDayWardAgeGroups(electionId: number | undefined, partNumber?: string, pollingDate?: string, refreshInterval: number = 30000) {
  return useSlice<PollDayWardAgeGroupsAggregate>(
    (ifNone) => getPollDayWardAgeGroups(electionId!, partNumber, pollingDate, ifNone),
    [electionId, partNumber, pollingDate], refreshInterval, electionId ? () => recomputePollDayWardAgeGroups(electionId!, partNumber, pollingDate) : undefined
  );
}

export function usePollDayBoothSummary(electionId: number | undefined, pollingDate?: string, refreshInterval: number = 30000) {
  return useSlice<PollDayBoothSummaryAggregate>(
    (ifNone) => getPollDayBoothSummary(electionId!, pollingDate, ifNone),
    [electionId, pollingDate], refreshInterval, electionId ? () => recomputePollDayBoothSummary(electionId!, pollingDate) : undefined
  );
}

export function usePollDayPartWisePolling(
  electionId: number | undefined,
  pollingDate?: string,
  filters?: any,
  refreshInterval: number = 30000,
  pollMode: SlicePollMode = 'load'
) {
  const filtersKey = filters ? JSON.stringify(filters) : undefined;
  const stableFilters = useMemo(() => filters, [filtersKey]);
  const fetchPartWisePolling = useCallback(
    (ifNone?: string) =>
      getPollDayPartWisePolling(electionId!, pollingDate, stableFilters, ifNone),
    [electionId, pollingDate, stableFilters]
  );
  const recomputePartWisePolling = useCallback(
    () => recomputePollDayPartWisePolling(electionId!, pollingDate, stableFilters),
    [electionId, pollingDate, stableFilters]
  );

  return useSlice<PollDayPartWisePollingAggregate>(
    fetchPartWisePolling,
    [electionId, pollingDate, filtersKey],
    refreshInterval,
    electionId ? recomputePartWisePolling : undefined,
    pollMode
  );
}

export function usePollDayFamilyWisePolling(
  electionId: number | undefined,
  pollingDate?: string,
  filters?: any,
  refreshInterval: number = 30000,
  pollMode: SlicePollMode = 'load'
) {
  const filtersKey = filters ? JSON.stringify(filters) : undefined;
  const stableFilters = useMemo(() => filters, [filtersKey]);
  const fetchFamilyWisePolling = useCallback(
    (ifNone?: string) =>
      getPollDayFamilyWisePolling(electionId!, pollingDate, stableFilters, ifNone),
    [electionId, pollingDate, stableFilters]
  );
  const recomputeFamilyWisePolling = useCallback(
    () => recomputePollDayFamilyWisePolling(electionId!, pollingDate, stableFilters),
    [electionId, pollingDate, stableFilters]
  );

  return useSlice<PollDayFamilyWisePollingAggregate>(
    fetchFamilyWisePolling,
    [electionId, pollingDate, filtersKey],
    refreshInterval,
    electionId ? recomputeFamilyWisePolling : undefined,
    pollMode
  );
}

export function usePollDaySectionWisePolling(
  electionId: number | undefined,
  partNos: number[] | number,
  refreshInterval: number = 30000
) {
  const partNosArray = useMemo(() => 
    Array.isArray(partNos) ? partNos : [partNos],
    [partNos]
  );
  
  const partNosKey = partNosArray.join(',');

  const fetchSectionWisePolling = useCallback(
    async (ifNone?: string) => {
      if (!electionId) return { data: [], _notModified: false } as any;
      const res = await getVoterCountBySectionApi(electionId, partNosArray);
      return {
        ...res,
        _notModified: false // VoterCountBySectionApi doesn't support ETag yet
      };
    },
    [electionId, partNosKey]
  );

  return useSlice<VoterCountBySectionResponse>(
    fetchSectionWisePolling,
    [electionId, partNosKey],
    refreshInterval
  );
}

// Helper transformers
export function parseJsonMap<T = Record<string, number>>(json?: string): [string, number][] {
  const m = safeParseMap<T & Record<string, number>>(json);
  if (!m) return [];
  return Object.entries(m).sort((a,b) => b[1] - a[1]);
}

export function parseCadrePerformance(json?: string) {
  const arr = safeParseMap<any[]>(json);
  if (!Array.isArray(arr)) return [];
  return arr.map((c: any) => ({ id: c.volunteerId || c.id, name: c.volunteerName || c.name, votersCreated: c.totalVoterCreated || c.votersCreated || 0 }));
}
