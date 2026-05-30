import { useState, useCallback } from 'react';
import type { SliceState } from '../types/reporting';

// Generic hook for any reporting slice fetch + recompute lifecycle
export function useReportingSlice<T>(fetcher: (ifNoneMatch?: string) => Promise<any>, recomputeFn?: () => Promise<any>) {
  const [state, setState] = useState<SliceState<T>>({ data: null, loading: false });

  const load = useCallback(async () => {
    if (state.loading) return;
    setState(s => ({ ...s, loading: true, error: undefined }));
    try {
      const resp = await fetcher(state.etag);
      if ((resp as any)._notModified) {
        setState(s => ({ ...s, loading: false }));
        return;
      }
      const { _etag, freshnessSeconds, refreshedAt, ...rest } = resp;
      setState({ data: rest as T, loading: false, etag: _etag, freshnessSeconds, refreshedAt });
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e?.response?.data?.message || 'Load failed' }));
    }
  }, [fetcher, state.loading, state.etag]);

  const recompute = useCallback(async () => {
    if (!recomputeFn) return;
    setState(s => ({ ...s, loading: true, error: undefined }));
    try {
      const resp = await recomputeFn();
      const { _etag, freshnessSeconds, refreshedAt, ...rest } = resp as any;
      setState({ data: rest as T, loading: false, etag: _etag, freshnessSeconds, refreshedAt });
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e?.response?.data?.message || 'Recompute failed' }));
    }
  }, [recomputeFn]);

  return { ...state, load, recompute };
}

export default useReportingSlice;
